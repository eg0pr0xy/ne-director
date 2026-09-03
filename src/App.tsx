/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './store/AppStore';
import { AppLayout } from './layouts/AppLayout';
import { TodayPage } from './pages/TodayPage';
import { AttentionPage } from './pages/AttentionPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PeoplePage } from './pages/PeoplePage';
import { TimelinePage } from './pages/TimelinePage';
import { SearchPage } from './pages/SearchPage';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';

const PageRouter = () => {
  const { currentPage } = useApp();

  switch (currentPage) {
    case 'TODAY':
      return <TodayPage />;
    case 'ATTENTION':
      return <AttentionPage />;
    case 'PROJECTS':
      return <ProjectsPage />;
    case 'PEOPLE':
      return <PeoplePage />;
    case 'TIMELINE':
      return <TimelinePage />;
    case 'SEARCH':
      return <SearchPage />;
    case 'CHAT':
      return <ChatPage />;
    case 'SETTINGS':
      return <SettingsPage />;
    case 'PROFILE':
      return <ProfilePage />;
    default:
      return <TodayPage />;
  }
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout>
        <PageRouter />
      </AppLayout>
    </AppProvider>
  );
}
