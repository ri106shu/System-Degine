import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { registerSchema } from '../../utils/validationSchemas';
import { registerUser, clearAuthError } from '../../features/auth/authSlice';
import { ROUTES } from '../../app/constants';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const onSubmit = async (values) => {
    const result = await dispatch(registerUser(values));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created \u2014 let\u2019s start your streak');
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Create your account</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Start your roadmap in under a minute.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input
          label="Name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {error && (
          <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-1 w-full" loading={status === 'loading'}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-[var(--color-accent)]">
          Log in
        </Link>
      </p>
    </Card>
  );
}
