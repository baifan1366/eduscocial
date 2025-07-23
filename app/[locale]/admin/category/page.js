import CreateCategoryDialog from '@/components/admin/category/CreateCategoryDialog'
import { Button } from '@/components/ui/button'

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
          <h2>Category</h2>
          <CreateCategoryDialog>
            <Button variant="orange"> + Create Category</Button>
          </CreateCategoryDialog>
        </div>
      </div>
    );
}