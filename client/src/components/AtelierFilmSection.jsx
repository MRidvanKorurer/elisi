import { Box } from '@mui/material';
import SiteContainer from './SiteContainer';
import HomepageFilm from './HomepageFilm';

export default function AtelierFilmSection() {
    return (
        <SiteContainer sx={{ mb: { xs: 8, md: 12 }, px: { xs: 2.5, sm: 4 } }}>
            <Box sx={{ width: '100%', borderRadius: { xs: '20px', md: '28px' }, overflow: 'hidden' }}>
                <HomepageFilm embedded />
            </Box>
        </SiteContainer>
    );
}