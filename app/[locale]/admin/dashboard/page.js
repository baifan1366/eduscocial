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
        <main>
            <div className="max-w-md mx-auto py-10 min-w-[80%]">
                <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
        </main>
    );
}
