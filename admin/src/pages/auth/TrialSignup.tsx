import { Component, createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import * as authApi from '~/api/auth';
import { logger } from '../../utils/logger';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '~/components/common/Button';
import TextField from '~/components/common/TextField';
import Select from '~/components/common/Select';

const TrialSignup: Component = () => {
  const [businessName, setBusinessName] = createSignal('');
  const [fullName, setFullName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [locations, setLocations] = createSignal('');
  const [agreeToTerms, setAgreeToTerms] = createSignal(false);
  const [error, setError] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!agreeToTerms()) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);

    try {
      logger.auth(`Attempting trial signup for: ${email()}`);

      // Use centralized authApi for consistent error handling, logging, and token refresh
      const result = await authApi.trialSignup({
        businessName: businessName(),
        fullName: fullName(),
        email: email(),
        phone: phone(),
        password: password(),
        locations: locations(),
        agreeToTerms: agreeToTerms(),
      });

      logger.auth(`Signup successful: ${result.user.email}`);
      logger.auth('Redirecting to dashboard - auth will be initialized there...');

      // Navigate to dashboard - ProtectedLayout will initialize auth
      navigate('/dashboard/overview', { replace: true });
    } catch (err) {
      logger.error('Signup failed', err);
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Start Your Free Trial"
      subtitle="Get 14 days of full access to BakeWind. No credit card required."
    >
      <form onSubmit={handleSubmit} class="space-y-4">
        <TextField
          label="Business Name"
          type="text"
          id="businessName"
          value={businessName()}
          onInput={(e) => setBusinessName(e.currentTarget.value)}
          required
          autocomplete="organization"
          placeholder="Your Bakery Name"
        />

        <TextField
          label="Your Name"
          type="text"
          id="fullName"
          value={fullName()}
          onInput={(e) => setFullName(e.currentTarget.value)}
          required
          autocomplete="name"
          placeholder="John Smith"
        />

        <TextField
          label="Email Address"
          type="email"
          id="email"
          value={email()}
          onInput={(e) => setEmail(e.currentTarget.value)}
          required
          autocomplete="email"
          placeholder="john@yourbakery.com"
        />

        <TextField
          label="Phone Number"
          type="tel"
          id="phone"
          value={phone()}
          onInput={(e) => setPhone(e.currentTarget.value)}
          required
          autocomplete="tel"
          placeholder="+1 (555) 123-4567"
        />

        <TextField
          label="Password"
          type="password"
          id="password"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
          required
          autocomplete="new-password"
          placeholder="Create a secure password"
        />

        <Select
          label="Number of Locations"
          id="locations"
          value={locations()}
          onChange={(e) => setLocations(e.currentTarget.value)}
          required
        >
          <option value="">Select number of locations</option>
          <option value="1">1 location</option>
          <option value="2-3">2-3 locations</option>
          <option value="4-10">4-10 locations</option>
          <option value="10+">10+ locations</option>
        </Select>

        {/* Terms & Conditions */}
        <div class="flex items-start gap-2">
          <input
            type="checkbox"
            id="agreeToTerms"
            checked={agreeToTerms()}
            onChange={(e) => setAgreeToTerms(e.currentTarget.checked)}
            required
            class="mt-1 flex-shrink-0"
            style={{ "accent-color": "var(--primary-color)" }}
          />
          <label for="agreeToTerms" class="text-sm" style={{ color: "var(--text-secondary)" }}>
            I agree to the{' '}
            <a href="#terms" style={{ color: "var(--primary-color)" }} class="hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#privacy" style={{ color: "var(--primary-color)" }} class="hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        {/* Error message */}
        <Show when={error()}>
          <div
            class="p-4 rounded-lg"
            style={{
              "background-color": "var(--error-light)",
              color: "var(--error-color)"
            }}
          >
            {error()}
          </div>
        </Show>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading()}
          variant="primary"
          size="lg"
          fullWidth
        >
          {isLoading() ? 'Creating Account...' : 'Start Free Trial'}
        </Button>
      </form>

      {/* Links */}
      <div class="mt-6 text-center">
        <p class="text-sm" style={{ color: "var(--text-secondary)" }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: "var(--primary-color)" }} class="font-medium hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </AuthLayout>
  );
};

export default TrialSignup;
