import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { loginSchema } from '../../utils/validationSchemas';
import { loginUser, clearAuthError } from '../../features/auth/authSlice';
import { ROUTES, getPostAuthRoute } from '../../app/constants';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const onSubmit = async (values) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.user.name.split(' ')[0]}`);
      navigate(getPostAuthRoute(result.payload.user));
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Log in</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Pick up where you left off.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
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
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--color-border-strong)] accent-[var(--color-accent)]"
            {...register('rememberMe')}
          />
          Remember me
        </label>

        {error && (
          <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-1 w-full" loading={status === 'loading'}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        New here?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-[var(--color-accent)]">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
