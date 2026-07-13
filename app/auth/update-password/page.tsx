import UpdatePasswordForm from './UpdatePasswordForm';

interface UpdatePasswordPageProps {
  searchParams?: {
    error?: string;
  };
}

export default function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  return <UpdatePasswordForm initialError={searchParams?.error} />;
}
