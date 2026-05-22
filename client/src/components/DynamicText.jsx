import React from 'react';
import { useDynamicTranslation } from '../hooks/useDynamicTranslation';
import { Text, Skeleton } from '@chakra-ui/react';

const DynamicText = ({ text, as = 'span', noSkeleton = false, ...props }) => {
  const { translatedText, isTranslating } = useDynamicTranslation(text);

  if (isTranslating && !noSkeleton) {
    return <Skeleton display="inline-block" minW="50px" h="1em" {...props} />;
  }

  const Component = as === 'span' ? 'span' : Text;

  return (
    <Component {...props}>
      {translatedText}
    </Component>
  );
};

export default DynamicText;
