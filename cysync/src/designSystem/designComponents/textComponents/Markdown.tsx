import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { shell } from 'electron';
import ReactMarkdown from 'markdown-to-jsx';
import * as React from 'react';

function MarkdownListItem(props: any) {
  return <Box component="li" sx={{ typography: 'body1' }} {...props} />;
}

const openExternalLink = (event: React.SyntheticEvent, link: string) => {
  event.preventDefault();
  shell.openExternal(link);
};

const ExternalLink: React.FC = ({ children }) => (
  <Link
    href="#"
    onClick={e => openExternalLink(e, children.toString())}
    color="secondary"
    underline="hover"
  >
    {children}
  </Link>
);

const options = {
  overrides: {
    h1: {
      component: Typography,
      props: {
        color: 'textPrimary',
        variant: 'h5',
        gutterBottom: true,
        style: { fontWeight: 700, marginTop: '1.5rem' }
      }
    },
    h5: {
      component: Typography,
      props: {
        variant: 'caption',
        color: 'textPrimary'
      }
    },
    p: {
      component: Typography,
      props: {
        color: 'textPrimary',
        paragraph: true
      }
    },
    a: {
      component: ExternalLink
    },
    li: {
      component: MarkdownListItem
    }
  }
};

export default function Markdown(props: any) {
  return <ReactMarkdown options={options} {...props} />;
}
