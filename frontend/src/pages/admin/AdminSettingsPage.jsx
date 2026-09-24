import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Shield,
  Server,
  Sliders,
  FileStack,
  Bell,
  LayoutDashboard,
  Clock,
  Database,
  AlertTriangle,
  Save,
  KeyRound,
  ShieldOff,
  Monitor,
  Check,
  X,
} from 'lucide-react';
import {
  fetchAdminSettings,
  updatePlatformSettings,
  updateModuleSettings,
  changeAdminPassword,
  fetchDatabaseStats,
  resetAdminSettings,
  clearPasswordErrors,
} from '../../features/adminSettings/adminSettingsSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Skeleton from '../../components/ui/Skeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Toggle from '../../components/ui/Toggle';

function SectionHeading({ icon: Icon, title }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon size={16} className="text-[var(--color-text-faint)]" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{title}</h3>
    </div>
  );
}

function NotYetAvailable({ label, note }) {
  return (
    <div className="flex items-center justify-between border-t border-[var(--color-border)] py-3 first:border-t-0">
      <div>
        <p className="text-sm text-[#16181D] dark:text-[#E9EAEC]">{label}</p>
        <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">{note}</p>
      </div>
      <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-faint)]">Not configured</span>
    </div>
  );
}

function PasswordStrengthChecklist({ password }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'One number', pass: /[0-9]/.test(password) },
  ];
  return (
    <ul className="mt-1.5 flex flex-col gap-0.5">
      {checks.map((c) => (
        <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.pass ? 'text-[var(--color-success)]' : 'text-[var(--color-text-faint)]'}`}>
          {c.pass ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
          {c.label}
        </li>
      ))}
    </ul>
  );
}

function ChangePasswordForm() {
  const dispatch = useDispatch();
  const { passwordStatus, passwordErrors } = useSelector((s) => s.adminSettings);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const submitting = passwordStatus === 'loading';

  const fieldError = (field) => passwordErrors?.find((e) => e.field === field)?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const result = await dispatch(changeAdminPassword(form));
    if (!result.error) setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        type="password"
        label="Current Password"
        value={form.currentPassword}
        onChange={(e) => {
          setForm({ ...form, currentPassword: e.target.value });
          if (passwordErrors) dispatch(clearPasswordErrors());
        }}
        error={fieldError('currentPassword')}
        required
      />
      <div>
        <Input
          type="password"
          label="New Password"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          error={fieldError('newPassword')}
          required
        />
        {form.newPassword && <PasswordStrengthChecklist password={form.newPassword} />}
      </div>
      <Input
        type="password"
        label="Confirm New Password"
        value={form.confirmNewPassword}
        onChange={(e) => setForm({ ...form, confirmNewPassword: e.target.value })}
        error={fieldError('confirmNewPassword')}
        required
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting}>
          <KeyRound size={14} aria-hidden="true" />
          {submitting ? 'Changing…' : 'Change Password'}
        </Button>
      </div>
    </form>
  );
}

function ModuleAvailability({ settings }) {
  const dispatch = useDispatch();
  const { moduleSaveStatus } = useSelector((s) => s.adminSettings);
  const [pendingToggle, setPendingToggle] = useState(null); // { module: 'lld'|'hld', next: boolean }
  const saving = moduleSaveStatus === 'loading';

  const confirmToggle = async () => {
    if (!pendingToggle || saving) return;
    const field = pendingToggle.module === 'lld' ? 'lldEnabled' : 'hldEnabled';
    const result = await dispatch(updateModuleSettings({ [field]: pendingToggle.next }));
    // Only close on success — on failure the dialog stays open with the
    // error toast already shown (from the thunk), so the admin can retry
    // without re-triggering the confirmation step from scratch.
    if (!result.error) setPendingToggle(null);
  };

  const rows = [
    { key: 'lld', label: 'LLD', enabled: settings.modules.lldEnabled },
    { key: 'hld', label: 'HLD', enabled: settings.modules.hldEnabled },
  ];

  return (
    <>
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between border-t border-[var(--color-border)] py-3 first:border-t-0">
          <div>
            <p className="text-sm text-[#16181D] dark:text-[#E9EAEC]">{row.label}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">
              {row.enabled ? 'Visible to users' : 'Hidden from users \u2014 admin can still manage its content'}
            </p>
          </div>
          <Toggle
            checked={row.enabled}
            disabled={saving}
            label={`${row.enabled ? 'Disable' : 'Enable'} ${row.label} module`}
            // Destructive toggle: onChange only ever opens the
            // confirmation — the checked value passed to <Toggle> keeps
            // reading straight from `settings`, so nothing visually
            // flips until updateModuleSettings actually succeeds and the
            // store updates.
            onChange={(next) => setPendingToggle({ module: row.key, next })}
          />
        </div>
      ))}

      <ConfirmDialog
        open={Boolean(pendingToggle)}
        title={`${pendingToggle?.next ? 'Enable' : 'Disable'} ${pendingToggle?.module?.toUpperCase()}?`}
        message={
          pendingToggle?.next
            ? `This will make ${pendingToggle?.module?.toUpperCase()} preparation features available to users again.`
            : `This will hide ${pendingToggle?.module?.toUpperCase()} preparation features from users. You can still manage ${pendingToggle?.module?.toUpperCase()} content as admin.`
        }
        confirmLabel={saving ? 'Saving\u2026' : pendingToggle?.next ? 'Enable' : 'Disable'}
        onConfirm={confirmToggle}
        onCancel={() => setPendingToggle(null)}
        loading={saving}
      />
    </>
  );
}

function PlatformInformationForm({ settings }) {
  const dispatch = useDispatch();
  const { saveStatus } = useSelector((s) => s.adminSettings);
  const [form, setForm] = useState({ name: settings.platform.name, description: settings.platform.description });
  const submitting = saveStatus === 'loading';

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(updatePlatformSettings(form));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input label="Platform Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting}>
          <Save size={14} aria-hidden="true" />
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

function DatabaseStats() {
  const dispatch = useDispatch();
  const { dbStats, dbStatsStatus } = useSelector((s) => s.adminSettings);

  useEffect(() => {
    dispatch(fetchDatabaseStats());
  }, [dispatch]);

  const rows = dbStats
    ? [
        ['Topics', dbStats.topics],
        ['Questions', dbStats.questions],
        ['Topic Prompts', dbStats.topicPrompts],
        ['Roadmaps', dbStats.roadmaps],
        ['User Notes', dbStats.userNotes],
        ['Mock Interviews', dbStats.mockInterviews],
      ]
    : [];

  if (dbStatsStatus === 'loading' || dbStatsStatus === 'idle') {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-[var(--color-surface-2)] p-3">
          <p className="text-xs text-[var(--color-text-faint)]">{label}</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminSettingsPage() {
  const dispatch = useDispatch();
  const { settings, status } = useSelector((s) => s.adminSettings);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminSettings());
  }, [dispatch]);

  const confirmReset = () => {
    dispatch(resetAdminSettings());
    setResetOpen(false);
  };

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (status === 'failed' || !settings) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">Unable to load settings.</p>
        <Button onClick={() => dispatch(fetchAdminSettings())}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Settings</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Platform-wide configuration for InterviewForge.</p>
      </div>

      {/* Security */}
      <Card className="p-5">
        <SectionHeading icon={Shield} title="Security" />
        <div className="mt-3 flex flex-col gap-1">
          <div className="border-t border-[var(--color-border)] pt-3 first:border-t-0 first:pt-0">
            <p className="mb-2 text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">Change Password</p>
            <ChangePasswordForm />
          </div>
          <NotYetAvailable label="Two-Factor Authentication" note="Two-factor authentication is not configured yet." />
          <div className="flex items-center justify-between border-t border-[var(--color-border)] py-3">
            <div className="flex items-center gap-2">
              <Monitor size={14} className="text-[var(--color-text-faint)]" aria-hidden="true" />
              <div>
                <p className="text-sm text-[#16181D] dark:text-[#E9EAEC]">Current Session</p>
                <p className="text-xs text-[var(--color-text-faint)]">{'This device \u00b7 Active now'}</p>
              </div>
            </div>
          </div>
          <NotYetAvailable label="Login Security" note="Failed-attempt lockout is not configured yet." />
        </div>
      </Card>

      {/* Platform */}
      <Card className="p-5">
        <SectionHeading icon={Server} title="Platform" />
        <div className="mt-3 flex flex-col gap-1">
          <div className="border-t border-[var(--color-border)] pt-3 first:border-t-0 first:pt-0">
            <p className="mb-2 text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">Platform Information</p>
            <PlatformInformationForm settings={settings} />
          </div>
          <div className="border-t border-[var(--color-border)] pt-3">
            <p className="mb-1 text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">Interview Modules</p>
            <ModuleAvailability settings={settings} />
          </div>
          <NotYetAvailable label="Maintenance Mode" note="Maintenance mode is not configured yet." />
        </div>
      </Card>

      {/* Interview / Content / Notifications / Dashboard / System — honest placeholders */}
      <Card className="p-5">
        <SectionHeading icon={Sliders} title="Interview Configuration" />
        <div className="mt-1">
          <NotYetAvailable
            label="Mock interview, difficulty, duration and question-count configuration"
            note={'Not yet available \u2014 creating a mock uses fixed system defaults today.'}
          />
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading icon={FileStack} title="Content" />
        <div className="mt-1">
          <NotYetAvailable label="Default visibility, pagination and ordering" note={'Not yet available \u2014 admin content pages use fixed defaults today.'} />
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading icon={Bell} title="Notifications" />
        <div className="mt-1">
          <NotYetAvailable label="Admin and system alerts" note={'Not yet available \u2014 no notification delivery system is implemented yet.'} />
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading icon={LayoutDashboard} title="Dashboard Preferences" />
        <div className="mt-1">
          <NotYetAvailable label="Widget visibility for /admin/dashboard" note={'Not yet available \u2014 the admin dashboard shows its full fixed layout today.'} />
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading icon={Clock} title="System Preferences" />
        <div className="mt-1">
          <NotYetAvailable label="Timezone, date format, time format" note={"Not yet available \u2014 admin pages use the browser's local formatting today."} />
        </div>
      </Card>

      {/* Data & Maintenance */}
      <Card className="p-5">
        <SectionHeading icon={Database} title="Data & Maintenance" />
        <div className="mt-3">
          <p className="mb-2 text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">Database Statistics</p>
          <DatabaseStats />
        </div>
        <div className="mt-4 border-t border-[var(--color-border)] pt-3">
          <NotYetAvailable label="Clear Application Cache" note={'Not yet available \u2014 this deployment has no cache layer to clear.'} />
        </div>
        <div className="border-t border-[var(--color-border)] pt-3">
          <NotYetAvailable label="Export Platform Data" note="Not yet available." />
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-[var(--color-danger)]/30 p-5">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle size={16} className="text-[var(--color-danger)]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-[var(--color-danger)]">Danger Zone</h3>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
          <div>
            <p className="text-sm text-[#16181D] dark:text-[#E9EAEC]">Reset Platform Settings</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">Restore all admin-configurable settings to their defaults.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)}>
            <ShieldOff size={14} aria-hidden="true" />
            Reset
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        title="Reset all platform settings?"
        message="This restores Platform Information, Module Availability, and every other configurable setting to their defaults. This cannot be undone."
        confirmLabel="Reset Settings"
        onConfirm={confirmReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
