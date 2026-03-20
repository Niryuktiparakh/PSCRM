import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";

export default function AdminPage() {
  return (
    <AppLayout title="Admin Dashboard">
      <div className="space-y-6 max-w-xl">
        <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Admin Dashboard</h3>
          <p className="text-sm text-on-surface-variant mb-6">
            This dashboard is under development. Official and Admin views will be available in a future update.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg font-bold text-sm hover:bg-primary-container hover:text-on-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
