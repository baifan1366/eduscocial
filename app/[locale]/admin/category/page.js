import DisplayAllCategories from '@/components/admin/category/DisplayAllCategories'

export const metadata = {
  title: 'Category | EduSocial',
  description: 'Category',
  openGraph: {
    title: 'Category',
    images: ['/slogan-removebg-preview.png'],
  },
};

export default function CategoryPage() {
    return (
      <div className="container py-3 min-w-[80%]">
        <div className="flex justify-between items-center mb-6">
          <DisplayAllCategories />
        </div>
      </div>
    );
}