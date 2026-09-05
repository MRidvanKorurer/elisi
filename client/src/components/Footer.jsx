// import React from 'react';
// import { 
//   Box, Container, Grid, Typography, IconButton, 
//   Link, TextField, Button, Divider, SvgIcon
// } from '@mui/material';
// import InstagramIcon from '@mui/icons-material/Instagram';
// import FacebookIcon from '@mui/icons-material/Facebook';
// import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
// import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
// import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';

// // LOGON (Yolun doğru olduğundan emin ol)
// import Logo from '../assets/logo1.svg?react';

// // --- ÖZEL ETSY İKONU ---
// const EtsyIcon = (props) => (
//   <SvgIcon {...props} viewBox="0 0 24 24">
//     <path d="M9.195 5.517c-1.353 0-1.895.385-1.895 1.55v1.275h3.692c1.233 0 1.638-.346 1.638-1.393h.648v4.062h-.648c0-1.045-.405-1.391-1.638-1.391H7.3v3.947c0 1.348.653 1.849 2.158 1.849 1.455 0 2.226-.412 2.766-1.579h.73l-1.066 3.013H4.498v-.541c1.226-.11 1.442-.486 1.442-1.603V8.127c0-1.117-.216-1.493-1.442-1.603v-.542h5.58c1.378 0 2.148.243 2.593 1.12h-.648c-.283-.756-.917-1.585-2.828-1.585zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18.5c-4.694 0-8.5-3.806-8.5-8.5S7.306 3.5 12 3.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5z" />
//   </SvgIcon>
// );

// export default function Footer({ setPage }) {
  
//   // Sosyal Medya Linklerin
//   const socialLinks = {
//     instagram: "https://instagram.com/",
//     facebook: "https://facebook.com/",
//     etsy: "https://etsy.com/"
//   };

//   const footerLinkSx = {
//     color: '#6E5252',
//     display: 'inline-block',
//     mb: 1.2,
//     textDecoration: 'none',
//     fontWeight: 600,
//     fontSize: '0.9rem',
//     transition: 'all 0.3s ease',
//     cursor: 'pointer',
//     '&:hover': { color: '#946D6D', transform: 'translateX(4px)' }
//   };

//   const socialIconSx = {
//     color: '#946D6D', 
//     backgroundColor: 'rgba(255,255,255,0.7)',
//     backdropFilter: 'blur(10px)',
//     boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
//     border: '1px solid rgba(148, 109, 109, 0.2)',
//     transition: 'all 0.3s ease',
//     '&:hover': {
//       backgroundColor: '#946D6D',
//       color: '#FFF',
//       transform: 'translateY(-4px)',
//       boxShadow: '0 8px 15px rgba(148, 109, 109, 0.25)'
//     }
//   };

//   const paymentPillSx = {
//     fontSize: '0.65rem',
//     fontWeight: 800,
//     border: '1px solid rgba(148, 109, 109, 0.3)',
//     borderRadius: '6px',
//     px: 1.2,
//     py: 0.4,
//     color: '#946D6D',
//     backgroundColor: 'rgba(255, 255, 255, 0.5)',
//     letterSpacing: '0.5px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center'
//   };

//   return (
//     <Box 
//       component="footer" 
//       sx={{ 
//         width: '100%',
//         mt: 10,
//         pt: 8,
//         pb: 4,
//         background: 'linear-gradient(180deg, rgba(148, 109, 109, 0.03) 0%, rgba(148, 109, 109, 0.08) 100%)',
//         backdropFilter: 'blur(20px)',
//         borderTop: '1px solid rgba(148, 109, 109, 0.2)',
//       }}
//     >
//       <Container maxWidth="lg"> 
        
//         {/* GRID SİSTEMİ DÜZELTİLDİ: Tek satırda kalmaları sağlandı */}
//         <Grid container spacing={{ xs: 4, md: 3, lg: 4 }}>
          
//           {/* 1. SÜTUN: MARKA LOGOSU VE SOSYAL MEDYA */}
//           <Grid item xs={12} sm={12} md={4}>
//             <Box 
//               sx={{ 
//                 mb: 2, 
//                 display: 'inline-block',
//                 cursor: 'pointer',
//                 transition: 'transform 0.3s ease',
//                 '&:hover': { transform: 'scale(1.02)' },
//                 '& svg': { 
//                   height: '55px', 
//                   width: 'auto', 
//                   maxWidth: '100%',
//                   display: 'block'
//                 } 
//               }}
//               onClick={() => setPage && setPage('home')} 
//             >
//               <Logo />
//             </Box>

//             <Typography variant="body2" sx={{ color: '#6E5252', mb: 3, lineHeight: 1.7, pr: { md: 2 } }}>
//               Evinize ve ruhunuza dokunan, tamamen el yapımı tasarım ürünleri. Geleneksel yöntemleri modern bir dille yeniden yorumluyoruz.
//             </Typography>
            
//             <Box sx={{ display: 'flex', gap: 1.5 }}>
//               <IconButton href={socialLinks.instagram} target="_blank" sx={socialIconSx}>
//                 <InstagramIcon />
//               </IconButton>
//               <IconButton href={socialLinks.facebook} target="_blank" sx={socialIconSx}>
//                 <FacebookIcon />
//               </IconButton>
//               <IconButton href={socialLinks.etsy} target="_blank" sx={socialIconSx} title="Etsy Mağazamız">
//                 <EtsyIcon />
//               </IconButton>
//             </Box>
//           </Grid>

//           {/* 2. SÜTUN: HIZLI LİNKLER */}
//           <Grid item xs={6} sm={4} md={2.5}>
//             <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', mb: 2.5, fontSize: '1.1rem' }}>
//               Kurumsal
//             </Typography>
//             <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//               <Link onClick={() => setPage && setPage('about')} sx={footerLinkSx}>Hakkımızda</Link>
//               <Link onClick={() => setPage && setPage('shop')} sx={footerLinkSx}>Tüm Ürünler</Link>
//               <Link onClick={() => setPage && setPage('contact')} sx={footerLinkSx}>İletişim</Link>
//               <Link onClick={() => setPage && setPage('blog')} sx={footerLinkSx}>Blog & Atölye</Link>
//             </Box>
//           </Grid>

//           {/* 3. SÜTUN: YARDIM & DESTEK */}
//           <Grid item xs={6} sm={4} md={2.5}>
//             <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', mb: 2.5, fontSize: '1.1rem' }}>
//               Yardım & Destek
//             </Typography>
//             <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//               <Link sx={footerLinkSx}>Sıkça Sorulan Sorular</Link>
//               <Link sx={footerLinkSx}>Kargo ve Teslimat</Link>
//               <Link sx={footerLinkSx}>İade ve Değişim</Link>
//               <Link sx={footerLinkSx}>Gizlilik Sözleşmesi</Link>
//               <Link sx={footerLinkSx}>Mesafeli Satış Sözleşmesi</Link>
//             </Box>
//           </Grid>

//           {/* 4. SÜTUN: İLETİŞİM & BÜLTEN (SAĞ TARAFI DOLDURAN KISIM) */}
//           <Grid item xs={12} sm={4} md={3}>
            
//             {/* İLETİŞİM BİLGİLERİ */}
//             <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', mb: 2, fontSize: '1.1rem' }}>
//               Bize Ulaşın
//             </Typography>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
//               <Typography variant="body2" sx={{ color: '#6E5252', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
//                 <EmailOutlinedIcon fontSize="small" sx={{ color: '#946D6D' }} /> info@seninmarkan.com
//               </Typography>
//               <Typography variant="body2" sx={{ color: '#6E5252', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
//                 <PhoneOutlinedIcon fontSize="small" sx={{ color: '#946D6D' }} /> +90 555 123 45 67
//               </Typography>
//             </Box>

//             {/* BÜLTEN ABONELİĞİ */}
//             <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', mb: 2, fontSize: '1.1rem' }}>
//               Bültene Abone Ol
//             </Typography>
//             <Box sx={{ display: 'flex', gap: 1 }}>
//               <TextField 
//                 fullWidth 
//                 placeholder="E-Posta adresiniz" 
//                 size="small" 
//                 variant="outlined"
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     backgroundColor: 'rgba(255,255,255,0.7)',
//                     borderRadius: '12px',
//                     '& fieldset': { borderColor: 'rgba(148, 109, 109, 0.4)' },
//                     '&:hover fieldset': { borderColor: '#946D6D' },
//                     '&.Mui-focused fieldset': { borderColor: '#946D6D', borderWidth: '2px' }
//                   },
//                   '& input::placeholder': { fontSize: '0.85rem' }
//                 }}
//               />
//               <Button 
//                 variant="contained" 
//                 sx={{ 
//                   backgroundColor: '#946D6D', 
//                   color: '#FFF',
//                   minWidth: '50px',
//                   borderRadius: '12px',
//                   boxShadow: '0 4px 10px rgba(148, 109, 109, 0.2)',
//                   '&:hover': { backgroundColor: '#6E5252', boxShadow: '0 6px 15px rgba(148, 109, 109, 0.3)' }
//                 }}
//               >
//                 <SendOutlinedIcon fontSize="small" />
//               </Button>
//             </Box>
//           </Grid>

//         </Grid>

//         <Divider sx={{ my: 4, borderColor: 'rgba(148, 109, 109, 0.2)' }} />

//         {/* ALT BİLGİ & GÜVENLİ ÖDEME (SAĞ ALT BOŞLUK DOLDURULDU) */}
//         <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 3 }}>
          
//           <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600 }}>
//             © {new Date().getFullYear()} Senin Markan. Tüm hakları saklıdır.
//           </Typography>
          
//           <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
//             <Typography variant="caption" fontWeight="700" sx={{ color: '#6E5252' }}>
//               Güvenli Alışveriş
//             </Typography>
            
//             {/* ŞIK ÖDEME YÖNTEMİ KARTLARI (SAĞ ALT KÖŞE) */}
//             <Box sx={{ display: 'flex', gap: 1 }}>
//               <Box sx={paymentPillSx}>VISA</Box>
//               <Box sx={paymentPillSx}>MasterCard</Box>
//               <Box sx={paymentPillSx}>TROY</Box>
//               <Box sx={{ ...paymentPillSx, backgroundColor: '#946D6D', color: '#FFF', border: 'none' }}>
//                 IYZICO
//               </Box>
//             </Box>
//           </Box>

//         </Box>
        
//       </Container>
//     </Box>
//   );
// }


import React from 'react';
import { 
  Box, Container, Grid, Typography, IconButton, 
  Link, TextField, Button, Divider, SvgIcon
} from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';

import Logo from '../assets/logo1.svg?react';

// --- ÖZEL ETSY İKONU ---
const EtsyIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M9.195 5.517c-1.353 0-1.895.385-1.895 1.55v1.275h3.692c1.233 0 1.638-.346 1.638-1.393h.648v4.062h-.648c0-1.045-.405-1.391-1.638-1.391H7.3v3.947c0 1.348.653 1.849 2.158 1.849 1.455 0 2.226-.412 2.766-1.579h.73l-1.066 3.013H4.498v-.541c1.226-.11 1.442-.486 1.442-1.603V8.127c0-1.117-.216-1.493-1.442-1.603v-.542h5.58c1.378 0 2.148.243 2.593 1.12h-.648c-.283-.756-.917-1.585-2.828-1.585zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18.5c-4.694 0-8.5-3.806-8.5-8.5S7.306 3.5 12 3.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5z" />
  </SvgIcon>
);

export default function Footer({ setPage }) {
  const socialLinks = {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    etsy: "https://etsy.com/"
  };

  const footerLinkSx = {
    color: '#6E5252',
    display: 'inline-block',
    mb: 1.2,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': { color: '#946D6D', transform: 'translateX(4px)' }
  };

  const socialIconSx = {
    color: '#946D6D', 
    backgroundColor: '#FFFFFF',
    boxShadow: '0 4px 10px rgba(148, 109, 109, 0.15)',
    border: '1px solid rgba(148, 109, 109, 0.25)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#946D6D',
      color: '#FFF',
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 15px rgba(148, 109, 109, 0.3)'
    }
  };

  const paymentPillSx = {
    fontSize: '0.65rem',
    fontWeight: 800,
    border: '1px solid rgba(148, 109, 109, 0.3)',
    borderRadius: '6px',
    px: 1.2,
    py: 0.4,
    color: '#946D6D',
    backgroundColor: '#FFFFFF',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <Box 
      component="footer" 
      sx={{ 
        width: '100%',
        mt: 10,
        pt: 8,
        pb: 4,
        // HAFİF KAHVERENGİ ARKA PLAN (KREM / KAHVE GEÇİŞİ)
        background: 'linear-gradient(180deg, rgba(148, 109, 109, 0.08) 0%, rgba(148, 109, 109, 0.18) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(148, 109, 109, 0.25)',
      }}
    >
      <Container maxWidth="lg"> 
        <Grid container spacing={{ xs: 4, md: 3, lg: 4 }}>
          
          {/* 1. SÜTUN: LOGO VE SOSYAL MEDYA */}
          <Grid item xs={12} sm={12} md={4}>
            <Box 
              sx={{ 
                mb: 2, 
                display: 'inline-block',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.02)' },
                '& svg': { 
                  height: '55px', 
                  width: 'auto', 
                  maxWidth: '100%',
                  display: 'block'
                } 
              }}
              onClick={() => setPage && setPage('home')} 
            >
              <Logo />
            </Box>

            <Typography variant="body2" sx={{ color: '#6E5252', mb: 3, lineHeight: 1.7, pr: { md: 2 } }}>
              Evinize ve ruhunuza dokunan, tamamen el yapımı tasarım ürünleri. Geleneksel yöntemleri modern bir dille yeniden yorumluyoruz.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <IconButton href={socialLinks.instagram} target="_blank" sx={socialIconSx}>
                <InstagramIcon />
              </IconButton>
              <IconButton href={socialLinks.facebook} target="_blank" sx={socialIconSx}>
                <FacebookIcon />
              </IconButton>
              <IconButton href={socialLinks.etsy} target="_blank" sx={socialIconSx} title="Etsy Mağazamız">
                <EtsyIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* 2. SÜTUN: HIZLI LİNKLER */}
          <Grid item xs={6} sm={4} md={2.5}>
            <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', mb: 2.5, fontSize: '1.1rem' }}>
              Kurumsal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link onClick={() => setPage && setPage('about')} sx={footerLinkSx}>Hakkımızda</Link>
              <Link onClick={() => setPage && setPage('shop')} sx={footerLinkSx}>Tüm Ürünler</Link>
              <Link onClick={() => setPage && setPage('contact')} sx={footerLinkSx}>İletişim</Link>
              <Link onClick={() => setPage && setPage('blog')} sx={footerLinkSx}>Blog & Atölye</Link>
            </Box>
          </Grid>

          {/* 3. SÜTUN: YARDIM & DESTEK */}
          <Grid item xs={6} sm={4} md={2.5}>
            <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', mb: 2.5, fontSize: '1.1rem' }}>
              Yardım & Destek
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link sx={footerLinkSx}>Sıkça Sorulan Sorular</Link>
              <Link sx={footerLinkSx}>Kargo ve Teslimat</Link>
              <Link sx={footerLinkSx}>İade ve Değişim</Link>
              <Link sx={footerLinkSx}>Gizlilik Sözleşmesi</Link>
              <Link sx={footerLinkSx}>Mesafeli Satış Sözleşmesi</Link>
            </Box>
          </Grid>

          {/* 4. SÜTUN: İLETİŞİM & BÜLTEN */}
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', mb: 2, fontSize: '1.1rem' }}>
              Bize Ulaşın
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3.5 }}>
              <Typography variant="body2" sx={{ color: '#6E5252', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                <EmailOutlinedIcon fontSize="small" sx={{ color: '#946D6D' }} /> info@seninmarkan.com
              </Typography>
              <Typography variant="body2" sx={{ color: '#6E5252', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                <PhoneOutlinedIcon fontSize="small" sx={{ color: '#946D6D' }} /> +90 555 123 45 67
              </Typography>
            </Box>

            <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', mb: 1.5, fontSize: '1.1rem' }}>
              Bültene Abone Ol
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField 
                fullWidth 
                placeholder="E-Posta adresiniz" 
                size="small" 
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    '& fieldset': { borderColor: 'rgba(148, 109, 109, 0.4)' },
                    '&:hover fieldset': { borderColor: '#946D6D' },
                    '&.Mui-focused fieldset': { borderColor: '#946D6D', borderWidth: '2px' }
                  },
                  '& input::placeholder': { fontSize: '0.85rem' }
                }}
              />
              <Button 
                variant="contained" 
                sx={{ 
                  backgroundColor: '#946D6D', 
                  color: '#FFF',
                  minWidth: '50px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 10px rgba(148, 109, 109, 0.25)',
                  '&:hover': { backgroundColor: '#6E5252' }
                }}
              >
                <SendOutlinedIcon fontSize="small" />
              </Button>
            </Box>
          </Grid>

        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(148, 109, 109, 0.25)' }} />

        {/* ALT BİLGİ & TELİF HAKKI */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 3 }}>
          <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600 }}>
            © {new Date().getFullYear()} Nik Bag. Tüm hakları saklıdır.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" fontWeight="700" sx={{ color: '#6E5252' }}>
              Güvenli Alışveriş:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={paymentPillSx}>VISA</Box>
              <Box sx={paymentPillSx}>MasterCard</Box>
              <Box sx={paymentPillSx}>TROY</Box>
              <Box sx={{ ...paymentPillSx, backgroundColor: '#946D6D', color: '#FFF', border: 'none' }}>
                IYZICO
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}