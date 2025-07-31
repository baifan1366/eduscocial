import DisplayAllBoards from '../../../../components/admin/boards/DisplayAllBoards';

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
      <div className="container py-3 min-w-[80%]">
        <div className="flex justify-between items-center mb-6">
          <DisplayAllBoards />
        </div>
      </div>
    );
}