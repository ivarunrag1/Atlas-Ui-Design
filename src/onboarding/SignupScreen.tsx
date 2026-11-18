import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { cn } from '@/lib/utils';
import { AuthHeading, AuthShell, Spinner } from './parts';
import { checkSlug, EXISTING_EMAILS, isEmail, isPersonalEmail, slugify, type SlugCheck, type Workspace } from './model';

const COUNTRIES = ['India', 'United Arab Emirates', 'Singapore', 'United States', 'United Kingdom', 'Germany', 'Netherlands', 'China', 'Vietnam'];

interface Form {
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  website: string;
  slug: string;
  usesEngine: 'no' | 'yes';
  engineDomain: string;
}

const EMPTY: Form = {
  company: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: 'India',
  website: '',
  slug: '',
  usesEngine: 'no',
  engineDomain: '',
};

const SAMPLE: Form = {
  company: 'Acme Logistics Pvt Ltd',
  firstName: 'Varun',
  lastName: 'Reddy',
  email: 'varun@acmelogistics.com',
  phone: '+91 98450 12345',
  country: 'India',
  website: 'acmelogistics.com',
  slug: '',
  usesEngine: 'no',
  engineDomain: '',
};

type Errors = Partial<Record<keyof Form, string>>;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.company.trim()) e.company = 'Enter your company name.';
  if (!f.firstName.trim()) e.firstName = 'Enter your first name.';
  if (!f.lastName.trim()) e.lastName = 'Enter your last name.';
  if (!f.email.trim()) e.email = 'Enter your work email.';
  else if (!isEmail(f.email)) e.email = 'Enter a valid email address.';
  else if (isPersonalEmail(f.email)) e.email = 'Use your work email. Personal addresses (Gmail, Yahoo, Outlook.com…) can’t be used.';
  if (!f.phone.trim()) e.phone = 'Enter a phone number.';
  if (!f.website.trim()) e.website = 'Enter your company website.';
  else if (!/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/.test(f.website.trim())) e.website = 'Enter a website like acmelogistics.com.';
  if (f.usesEngine === 'yes' && !f.engineDomain.trim()) e.engineDomain = 'Enter your Freight Engine domain.';
  return e;
}

/** Sample answers for the prototype's "Fill signup" control. */
export const sampleSignup = (engine: 'new' | 'existing'): Partial<Form> => ({
  ...SAMPLE,
  usesEngine: engine === 'existing' ? 'yes' : 'no',
  engineDomain: engine === 'existing' ? 'acme' : '',
});

/**
 * A1 — Website signup. Workspace URL is suggested from the company name and checked
 * live (taken → suggestions, reserved, too short). Once the user edits the URL it stops
 * following the company name (Q7 default). Email already on Atlas → sign in (D6).
 */
export function SignupScreen({
  initial,
  engine,
  onSubmit,
  onExistingUser,
  onSignIn,
}: {
  initial?: Partial<Form>;
  engine: 'new' | 'existing';
  onSubmit: (w: Workspace & { country: string }) => void;
  onExistingUser: (email: string) => void;
  onSignIn: () => void;
}) {
  const [f, setF] = useState<Form>(() => ({ ...EMPTY, usesEngine: engine === 'existing' ? 'yes' : 'no', ...initial }));
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const slug = slugEdited ? f.slug : slugify(f.company);

  // Live availability check — debounced to feel like a server round-trip. The result is
  // keyed by slug, so anything typed since shows "checking" until its own result lands.
  const [result, setResult] = useState<{ slug: string; check: SlugCheck } | null>(null);
  useEffect(() => {
    if (!slug) return;
    const t = setTimeout(() => setResult({ slug, check: checkSlug(slug) }), 500);
    return () => clearTimeout(t);
  }, [slug]);
  const check: SlugCheck = !slug ? { state: 'empty' } : result?.slug === slug ? result.check : { state: 'checking' };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const errors = validate(f);
  const show = (k: keyof Form) => (submitted || touched[k] ? errors[k] : undefined);
  const blur = (k: keyof Form) => () => setTouched((t) => ({ ...t, [k]: true }));
  const slugOk = check.state === 'available';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length || !slugOk) return;
    // D6: the email already belongs to an Atlas user → stop, nothing is created.
    if (EXISTING_EMAILS.includes(f.email.trim().toLowerCase())) {
      onExistingUser(f.email.trim());
      return;
    }
    onSubmit({
      company: f.company.trim(),
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      email: f.email.trim(),
      slug,
      engine: f.usesEngine === 'yes' ? 'existing' : 'new',
      engineDomain: f.engineDomain.trim().replace(/\.freightengine\.com$/, ''),
      country: f.country,
    });
  };

  return (
    <AuthShell>
      <AuthHeading title="Create your Atlas workspace">
        Free to start. No card needed. Already have a workspace?{' '}
        <button type="button" onClick={onSignIn} className="text-brand hover:underline">
          Sign in
        </button>
      </AuthHeading>

      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Company name" description={show('company') && <FieldError>{errors.company}</FieldError>}>
          <Input
            value={f.company}
            onChange={(e) => set('company', e.target.value)}
            onBlur={blur('company')}
            placeholder="Acme Logistics Pvt Ltd"
            autoComplete="organization"
            aria-invalid={!!show('company')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" description={show('firstName') && <FieldError>{errors.firstName}</FieldError>}>
            <Input value={f.firstName} onChange={(e) => set('firstName', e.target.value)} onBlur={blur('firstName')} autoComplete="given-name" />
          </Field>
          <Field label="Last name" description={show('lastName') && <FieldError>{errors.lastName}</FieldError>}>
            <Input value={f.lastName} onChange={(e) => set('lastName', e.target.value)} onBlur={blur('lastName')} autoComplete="family-name" />
          </Field>
        </div>

        <Field
          label="Work email"
          description={
            show('email') ? (
              <FieldError>{errors.email}</FieldError>
            ) : f.usesEngine === 'yes' ? (
              // D8 — helper, not validation: the same email links and syncs the existing account.
              <span className="flex items-start gap-1.5 text-muted">
                <Info size={12} className="mt-0.5 shrink-0" />
                Use the same email as your Freight Engine account to sync your existing records.
              </span>
            ) : (
              'This becomes your Admin login.'
            )
          }
        >
          <Input
            type="email"
            value={f.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={blur('email')}
            placeholder="you@company.com"
            autoComplete="email"
            aria-invalid={!!show('email')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone" description={show('phone') && <FieldError>{errors.phone}</FieldError>}>
            <Input
              type="tel"
              value={f.phone}
              onChange={(e) => set('phone', e.target.value)}
              onBlur={blur('phone')}
              placeholder="+91 98450 12345"
              autoComplete="tel"
            />
          </Field>
          <Field label="Country">
            <Select value={f.country} onChange={(e) => set('country', e.target.value)} options={COUNTRIES} />
          </Field>
        </div>

        <Field label="Company website" description={show('website') && <FieldError>{errors.website}</FieldError>}>
          <Input
            value={f.website}
            onChange={(e) => set('website', e.target.value)}
            onBlur={blur('website')}
            placeholder="acmelogistics.com"
            autoComplete="url"
          />
        </Field>

        {/* Workspace URL — suggested, editable, checked live */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="slug" className="t-label text-muted">
            Workspace URL
          </label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
            }}
            placeholder="your-company"
            end={<span className="t-desc">.freightify.ai</span>}
            aria-describedby="slug-status"
            aria-invalid={check.state === 'taken' || check.state === 'invalid'}
          />
          <div id="slug-status" aria-live="polite">
            <SlugStatus
              check={check}
              submitted={submitted}
              onPick={(s) => {
                setSlugEdited(true);
                set('slug', s);
              }}
            />
          </div>
        </div>

        {/* Freight Engine */}
        <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-ink">Do you already use Freight Engine?</p>
              <p className="t-desc text-faint">If not, we’ll set one up for you.</p>
            </div>
            <SegmentedControl
              value={f.usesEngine}
              onChange={(v) => {
                set('usesEngine', v);
                if (v === 'no') set('engineDomain', '');
              }}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
              aria-label="Do you already use Freight Engine?"
            />
          </div>
          {f.usesEngine === 'yes' && (
            <Field
              label="Freight Engine domain"
              description={
                show('engineDomain') ? (
                  <FieldError>{errors.engineDomain}</FieldError>
                ) : (
                  'We save it and connect when you sign in to Freight Engine. Nothing is read until then.'
                )
              }
            >
              <Input
                value={f.engineDomain}
                onChange={(e) => set('engineDomain', e.target.value)}
                onBlur={blur('engineDomain')}
                placeholder="acme"
                end={<span className="t-desc">.freightengine.com</span>}
              />
            </Field>
          )}
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full">
          Create workspace
        </Button>
        <p className="t-desc text-center text-faint">By creating a workspace you agree to the Terms and Privacy Policy.</p>
      </form>
    </AuthShell>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-start gap-1.5 text-danger">
      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
      {children}
    </span>
  );
}

function SlugStatus({ check, submitted, onPick }: { check: SlugCheck; submitted: boolean; onPick: (s: string) => void }) {
  switch (check.state) {
    case 'empty':
      return (
        <p className={cn('t-desc', submitted ? 'text-danger' : 'text-faint')}>
          {submitted ? 'Choose a workspace URL.' : 'We’ll suggest one from your company name.'}
        </p>
      );
    case 'checking':
      return (
        <p className="t-desc flex items-center gap-1.5 text-faint">
          <Spinner size={12} /> Checking availability…
        </p>
      );
    case 'available':
      return (
        <p className="t-desc flex items-center gap-1.5 text-success">
          <Check size={12} strokeWidth={3} /> Available. You can change it later without breaking anything.
        </p>
      );
    case 'invalid':
      return <FieldError>{check.reason}</FieldError>;
    case 'taken':
      return (
        <div className="t-desc flex flex-wrap items-center gap-1.5 text-danger">
          <AlertTriangle size={12} className="shrink-0" />
          <span>Already taken. Try:</span>
          {check.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-full border border-line px-2 py-0.5 text-ink transition-colors hover:border-line-strong hover:bg-subtle"
            >
              {s}
            </button>
          ))}
        </div>
      );
  }
}
