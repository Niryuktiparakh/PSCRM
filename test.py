
import sys, os
from dotenv import load_dotenv
load_dotenv('backend/.env')
sys.path.insert(0, os.path.abspath('backend'))
try:
    from db import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    res = db.execute(text('SELECT n.status, it.code FROM infra_nodes n JOIN infra_types it on it.id = n.infra_type_id')).mappings().all()
    print('Nodes:', list(res)[:5])
except Exception as e:
    print(e)
