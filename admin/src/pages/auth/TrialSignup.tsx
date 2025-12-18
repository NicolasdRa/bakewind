import { Component, createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import * as authApi from '~/api/auth';
import { logger } from '../../utils/logger';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '~/components/common/Button';

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
        {/* Business Name */}
        <div>
          <label for="businessName" class="block text-sm font-medium text-gray-700 mb-1">
            Business Name
          </label>
          <input
            type="text"
            id="businessName"
            value={businessName()}
            onInput={(e) => setBusinessName(e.currentTarget.value)}
            required
            autocomplete="organization"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your Bakery Name"
          />
        </div>

        {/* Full Name */}
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName()}
            onInput={(e) => setFullName(e.currentTarget.value)}
            required
            autocomplete="name"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Smith"
          />
        </div>

        {/* Email */}
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            required
            autocomplete="email"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="john@yourbakery.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phone()}
            onInput={(e) => setPhone(e.currentTarget.value)}
            required
            autocomplete="tel"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Password */}
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            autocomplete="new-password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Create a secure password"
          />
        </div>

        {/* Number of Locations */}
        <div>
          <label for="locations" class="block text-sm font-medium text-gray-700 mb-1">
            Number of Locations
          </label>
          <select
            id="locations"
            value={locations()}
            onChange={(e) => setLocations(e.currentTarget.value)}
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select number of locations</option>
            <option value="1">1 location</option>
            <option value="2-3">2-3 locations</option>
            <option value="4-10">4-10 locations</option>
            <option value="10+">10+ locations</option>
          </select>
        </div>

        {/* Terms & Conditions */}
        <div class="flex items-start gap-2">
          <input
            type="checkbox"
            id="agreeToTerms"
            checked={agreeToTerms()}
            onChange={(e) => setAgreeToTerms(e.currentTarget.checked)}
            required
            class="mt-1 flex-shrink-0"
          />
          <label for="agreeToTerms" class="text-sm text-gray-600">
            I agree to the{' '}
            <a href="#terms" class="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#privacy" class="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        {/* Error message */}
        <Show when={error()}>
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
        <p class="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" class="text-blue-600 hover:text-blue-700 font-medium">
            Sign in here
          </a>
        </p>
      </div>
    </AuthLayout>
  );
};

export default TrialSignup;
