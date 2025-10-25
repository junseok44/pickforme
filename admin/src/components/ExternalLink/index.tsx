import React from 'react';

const ExternalLink: React.FC<React.HTMLProps<HTMLAnchorElement>> = (props) => (
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  <a target='_blank' rel='noopener noreferrer' {...props} />
);

export default ExternalLink;
