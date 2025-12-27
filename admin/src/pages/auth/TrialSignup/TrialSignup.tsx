import { Component, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import * as authApi from '~/api/auth';
import { logger } from '~/utils/logger';
import AuthLayout from '~/layouts/AuthLayout';
import Button from '~/components/common/Button';
import Form from '~/components/common/Form';
import FormFooter from '~/components/common/FormFooter';
import { FormRow } from '~/components/common/FormRow';
import TextField from '~/components/common/TextField';
import Select from '~/components/common/Select';
import { Text } from '~/components/common/Typography';
import styles from './TrialSignup.module.css';

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
      <Form onSubmit={handleSubmit} error={error()}>
        <FormRow>
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
        </FormRow>

        <FormRow>
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
        </FormRow>

        <FormRow>
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
        </FormRow>

        {/* Terms & Conditions */}
        <div class={styles.checkboxContainer}>
          <input
            type="checkbox"
            id="agreeToTerms"
            checked={agreeToTerms()}
            onChange={(e) => setAgreeToTerms(e.currentTarget.checked)}
            required
            class={styles.checkbox}
          />
          <label for="agreeToTerms" class={styles.termsLabel}>
            <Text as="span" variant="body-sm" color="secondary">
              I agree to the{' '}
              <a href="#terms" class={styles.inlineLink}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" class={styles.inlineLink}>
                Privacy Policy
              </a>
            </Text>
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading()}
          variant="primary"
          size="lg"
          fullWidth
        >
          {isLoading() ? 'Creating Account...' : 'Start Free Trial'}
        </Button>
      </Form>

      <FormFooter links={[
        { href: "/login", text: "Already have an account? Sign in here" }
      ]} />
    </AuthLayout>
  );
};

export default TrialSignup;
