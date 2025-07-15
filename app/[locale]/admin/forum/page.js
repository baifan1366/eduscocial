import { Button } from '@/components/ui/button';
import CreateForumDialog from '../../../../components/admin/forum/CreateForumDialog';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Forum | EduSocial',
  description: 'Forum',
  openGraph: {
    title: 'Forum',
    images: ['/slogan-removebg-preview.png'],
  },
};

export default function ForumPage() {
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Forum</h1>
          <CreateForumDialog>
            <Button 
              variant="orange"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CreateForumDialog>
        </div>
        
        <div className="rounded-lg shadow p-6 bg-muted-background/80 border border-border">
          {/* 论坛列表将在这里显示 */}
          <p className="text-muted-foreground text-center py-10">No forum yet</p>
        </div>
      </div>
    );
}