
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 mt-16 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
