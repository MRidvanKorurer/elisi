import React from 'react';
import ColorLensOutlined from '@mui/icons-material/ColorLensOutlined';
import WavesOutlined from '@mui/icons-material/WavesOutlined';
import ForestOutlined from '@mui/icons-material/ForestOutlined';
import DiamondOutlined from '@mui/icons-material/DiamondOutlined';
import SelfImprovementOutlined from '@mui/icons-material/SelfImprovementOutlined';
import ContentCutOutlined from '@mui/icons-material/ContentCutOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'; 

const iconMap = {
  'ColorLensOutlined': ColorLensOutlined,
  'WavesOutlined': WavesOutlined,
  'ForestOutlined': ForestOutlined,
  'DiamondOutlined': DiamondOutlined,
  'SelfImprovementOutlined': SelfImprovementOutlined,
  'ContentCutOutlined': ContentCutOutlined,
  'CategoryOutlined': CategoryOutlinedIcon
};

export default function DynamicIcon({ iconName, ...props }) {
  const IconComponent = iconMap[iconName] || iconMap['CategoryOutlined']; // Bulamazsa default ikon
  return <IconComponent {...props} />;
}