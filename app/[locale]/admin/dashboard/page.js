export const metadata = {
    title: 'Dashboard | Admin',
    description: 'Admin Dashboard',
    openGraph: {
      title: 'Admin Dashboard',
      images: ['/slogan-removebg-preview.png'],
    },
  };

export default function AdminDashboardPage() {
    return (
        <div className="container py-3 min-w-[80%]">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
    );
}
