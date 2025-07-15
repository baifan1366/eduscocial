import { Button } from '@/components/ui/button';
import CreateBoardDialog from '../../../../components/admin/boards/CreateBoardDialog';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Boards | EduSocial',
  description: 'Boards',
  openGraph: {
    title: 'Boards',
    images: ['/slogan-removebg-preview.png'],
  },
};

export default function BoardPage() {
    return (
      <div className="container py-8 min-w-[80%]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Boards</h1>
          <CreateBoardDialog>
            <Button 
              variant="orange"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CreateBoardDialog>
        </div>
        
        <div className="rounded-lg shadow p-6 bg-muted-background/80 border border-border">
          <p className="text-muted-foreground text-center py-10">No board yet</p>
        </div>
      </div>
    );
}