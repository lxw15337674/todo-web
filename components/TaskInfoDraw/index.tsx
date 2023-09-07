import {
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import React from 'react';

const TaskInfoDraw = () => {
  return (
    <div className="shadow-2xl ml-2">
      <Divider />
      <List>
        {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
          <ListItem key={text}>
            <ListItemIcon>123</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
      <Divider />
    </div>
  );
};
export default TaskInfoDraw;
