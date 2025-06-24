import { Button, Typography, List } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import type { StartScreenProps } from '../types';

export function StartScreen({ 
  onOpenProject, 
  recentProjects, 
  onOpenRecentProject 
}: StartScreenProps) {
  return (
    <div className="start-screen" style={{ background: 'var(--color-main-background)', color: 'var(--color-foreground)', minHeight: '100vh' }}>
      <div className="welcome-section">
        <Typography.Title level={2}>Welcome to Pix3D</Typography.Title>
        <Typography.Paragraph type="secondary">
          Open a project folder to get started
        </Typography.Paragraph>
        <Button 
          type="primary" 
          size="large" 
          icon={<FolderOpenOutlined />} 
          onClick={onOpenProject}
        >
          Open Project Folder
        </Button>
      </div>
      
      {recentProjects.length > 0 && (
        <div className="recent-projects">
          <Typography.Title level={4}>Recent Projects</Typography.Title>
          <List
            dataSource={recentProjects}
            renderItem={(project) => (
              <List.Item 
                onClick={() => onOpenRecentProject(project)}
                style={{ cursor: 'pointer', padding: '8px 0' }}
              >
                <List.Item.Meta
                  title={project.name}
                  description={`Last opened: ${new Date(project.lastOpened).toLocaleString()}`}
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
}
