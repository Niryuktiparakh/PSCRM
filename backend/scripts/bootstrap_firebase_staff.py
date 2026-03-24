import argparse
import logging
import os
from typing import Dict, List, Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("bootstrap_firebase_staff")


def _setup_logging() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def _get_database_url() -> str:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is not set in environment or .env")
    return db_url


def _db_engine() -> Engine:
    return create_engine(_get_database_url())


def _candidate_service_account_paths() -> List[str]:
    explicit = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    here = os.path.dirname(__file__)
    backend_root = os.path.abspath(os.path.join(here, ".."))
    return [
        explicit or "",
        os.path.join(backend_root, "serviceAccountKey.json"),
        os.path.join(backend_root, "gcs-service-account.json"),
        os.path.join(backend_root, "storage_bucket.json"),
    ]


def _init_firebase_admin() -> None:
    import firebase_admin
    from firebase_admin import credentials

    if firebase_admin._apps:
        return

    for path in _candidate_service_account_paths():
        if path and os.path.exists(path):
            cred = credentials.Certificate(path)
            firebase_admin.initialize_app(cred)
            logger.info("Initialized Firebase Admin with service account: %s", path)
            return

    raise RuntimeError(
        "Could not initialize Firebase Admin. Set FIREBASE_SERVICE_ACCOUNT_KEY or place a service account file in backend/."
    )


def _fetch_staff_without_auth_uid(engine: Engine) -> List[Dict]:
    with engine.begin() as conn:
        rows = conn.execute(
            text(
                """
                SELECT id, email, full_name, role, auth_uid
                FROM users
                WHERE role IN ('official', 'admin', 'super_admin', 'worker', 'contractor')
                  AND is_active = TRUE
                  AND auth_uid IS NULL
                  AND email IS NOT NULL
                ORDER BY role, full_name
                """
            )
        ).mappings().all()
    return [dict(r) for r in rows]


def _update_auth_uid(engine: Engine, user_id: str, auth_uid: str) -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE users
                SET auth_uid = :auth_uid,
                    updated_at = NOW()
                WHERE id = CAST(:user_id AS uuid)
                """
            ),
            {"user_id": user_id, "auth_uid": auth_uid},
        )


def _provision_user(email: str, display_name: Optional[str]) -> str:
    import firebase_admin.auth as fb_auth

    existing = None
    try:
        existing = fb_auth.get_user_by_email(email)
    except Exception:
        existing = None

    if existing:
        return existing.uid

    created = fb_auth.create_user(email=email, display_name=display_name or None)
    return created.uid


def main() -> None:
    parser = argparse.ArgumentParser(description="Provision Firebase auth_uid for staff users")
    parser.add_argument("--dry-run", action="store_true", help="Print planned actions without creating Firebase users or updating DB")
    args = parser.parse_args()

    _setup_logging()
    load_dotenv()

    engine = _db_engine()
    staff_rows = _fetch_staff_without_auth_uid(engine)
    logger.info("Found %s active staff rows without auth_uid", len(staff_rows))

    if not staff_rows:
        print("No staff users require provisioning.")
        return

    if not args.dry_run:
        _init_firebase_admin()

    provisioned = 0
    skipped = 0
    errors = 0

    for row in staff_rows:
        user_id = str(row["id"])
        email = row.get("email")
        full_name = row.get("full_name")
        role = row.get("role")

        if not email:
            skipped += 1
            print(f"SKIP user_id={user_id} role={role} reason=missing_email")
            continue

        if args.dry_run:
            skipped += 1
            print(f"DRY-RUN would provision user_id={user_id} role={role} email={email}")
            continue

        try:
            firebase_uid = _provision_user(email=email, display_name=full_name)
            _update_auth_uid(engine, user_id=user_id, auth_uid=firebase_uid)
            provisioned += 1
            print(f"PROVISIONED user_id={user_id} role={role} email={email} auth_uid={firebase_uid}")
        except Exception as exc:
            errors += 1
            print(f"ERROR user_id={user_id} role={role} email={email} error={exc}")

    print("\nSummary")
    print(f"  provisioned: {provisioned}")
    print(f"  skipped:     {skipped}")
    print(f"  errors:      {errors}")


if __name__ == "__main__":
    main()
