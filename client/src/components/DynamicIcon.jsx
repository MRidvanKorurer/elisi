import React from 'react';
import ColorLensOutlined from '@mui/icons-material/ColorLensOutlined';
import WavesOutlined from '@mui/icons-material/WavesOutlined';
import ForestOutlined from '@mui/icons-material/ForestOutlined';
import DiamondOutlined from '@mui/icons-material/DiamondOutlined';
import SelfImprovementOutlined from '@mui/icons-material/SelfImprovementOutlined';
import ContentCutOutlined from '@mui/icons-material/ContentCutOutlined';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import WorkOutlineOutlined from '@mui/icons-material/WorkOutlineOutlined';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import FilterVintageOutlined from '@mui/icons-material/FilterVintageOutlined';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import BathroomOutlined from '@mui/icons-material/BathroomOutlined';
import WeekendOutlined from '@mui/icons-material/WeekendOutlined';
import ChildFriendlyOutlined from '@mui/icons-material/ChildFriendlyOutlined';
import ChairOutlined from '@mui/icons-material/ChairOutlined';
import CardGiftcardOutlined from '@mui/icons-material/CardGiftcardOutlined';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import PetsOutlined from '@mui/icons-material/PetsOutlined';
import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import SpaOutlined from '@mui/icons-material/SpaOutlined';
import WaterDropOutlined from '@mui/icons-material/WaterDropOutlined';
import ExtensionOutlined from '@mui/icons-material/ExtensionOutlined';
import KitchenOutlined from '@mui/icons-material/KitchenOutlined';

const iconMap = {
  ColorLensOutlined,
  WavesOutlined,
  ForestOutlined,
  DiamondOutlined,
  SelfImprovementOutlined,
  ContentCutOutlined,
  CategoryOutlined,
  ShoppingBagOutlined,
  AutoAwesomeOutlined,
  WorkOutlineOutlined,
  LocalFireDepartmentOutlined,
  FilterVintageOutlined,
  GridViewRounded,
  CheckroomOutlined,
  BathroomOutlined,
  WeekendOutlined,
  ChildFriendlyOutlined,
  ChairOutlined,
  CardGiftcardOutlined,
  MenuBookOutlined,
  PetsOutlined,
  CelebrationOutlined,
  SpaOutlined,
  WaterDropOutlined,
  ExtensionOutlined,
  KitchenOutlined
};

export default function DynamicIcon({ iconName, ...props }) {
  const IconComponent = iconMap[iconName] || CategoryOutlined;
  return <IconComponent {...props} />;
}
