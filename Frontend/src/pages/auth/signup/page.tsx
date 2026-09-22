import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
} from "lucide-react";
import { AuthShell } from "@/components/feature/AuthShell";
import { Button } from "@/components/base/Button";
import { InputField } from "@/components/base/InputField";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Please enter your name.";
    if (!EMAIL_RE.test(email)) e.email = "Please enter a valid email.";
    if (phone.trim().length < 7) e.phone = "Please enter a valid phone number.";
    if (password.length < 6) e.password = "Password must be at least 6 characters.";
    if (confirm !== password) e.confirm = "Passwords do not match.";
    if (!agreed) e.terms = "Please accept the terms to continue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      navigate("/preferences/currency");
    }, 800);
  };

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="A few details to begin your journey."
      footer={
        <p className="text-base text-foreground-700">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="font-bold text-primary-700">
            Login
          </button>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4" aria-label="Sign up form">
        <InputField
          id="name"
          label="Full name"
          value={name}
          onChange={setName}
          placeholder="Your name"
          autoComplete="name"
          required
          icon={<User aria-hidden="true" className="h-5 w-5" />}
          error={errors.name}
        />
        <InputField
          id="email"
          type="email"
          label="Email address"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          required
          icon={<Mail aria-hidden="true" className="h-5 w-5" />}
          error={errors.email}
        />
        <InputField
          id="phone"
          type="tel"
          label="Phone number"
          value={phone}
          onChange={setPhone}
          placeholder="+91 98765 43210"
          autoComplete="tel"
          required
          icon={<Phone aria-hidden="true" className="h-5 w-5" />}
          error={errors.phone}
        />
        <InputField
          id="password"
          type={show ? "text" : "password"}
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
          icon={<Lock aria-hidden="true" className="h-5 w-5" />}
          error={errors.password}
          rightSlot={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="flex h-12 w-12 items-center justify-center text-foreground-500"
            >
              {show ? (
                <EyeOff aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Eye aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          }
        />
        <InputField
          id="confirm"
          type={show ? "text" : "password"}
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Re-enter password"
          autoComplete="new-password"
          required
          icon={<Lock aria-hidden="true" className="h-5 w-5" />}
          error={errors.confirm}
        />

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-6 w-6 rounded accent-primary-500"
          />
          <span className="text-base text-foreground-700">
            I agree to the <span className="font-bold text-primary-700">Terms of Service</span> and{" "}
            <span className="font-bold text-primary-700">Privacy Policy</span>.
          </span>
        </label>
        {errors.terms && (
          <p role="alert" className="text-sm font-semibold text-accent-900">{errors.terms}</p>
        )}

        <Button type="submit" size="xl" fullWidth disabled={loading} iconRight={!loading && <ArrowRight aria-hidden="true" className="h-6 w-6" />}>
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </form>
    </AuthShell>
  );
}