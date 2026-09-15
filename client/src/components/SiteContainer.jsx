import { Container } from '@mui/material';
import { contentContainerSx } from '../utils/layout';

/**
 * Storefront içerik sütunu — varsayılan MUI lg (1200px) yerine daha geniş.
 */
export default function SiteContainer({ sx, children, ...props }) {
  const extra = Array.isArray(sx) ? sx : sx ? [sx] : [];
  return (
    <Container maxWidth={false} sx={[contentContainerSx, ...extra]} {...props}>
      {children}
    </Container>
  );
}
