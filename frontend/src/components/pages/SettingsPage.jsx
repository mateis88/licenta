import React from 'react';
import { Container, Typography, Paper, Box, FormControl, InputLabel, Select, MenuItem, Divider, useTheme } from '@mui/material';
import { useSettings } from '../../contexts/SettingsContext';
import HomeHeader from '../HomeHeader';

const SettingsPage = () => {
  const { currentTheme, setCurrentTheme, currentLanguage, setCurrentLanguage, translations } = useSettings();
  const theme = useTheme();
  const t = translations.settings;

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <HomeHeader />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            {t.title}
          </Typography>

          <Box sx={{ mt: 4 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="theme-select-label">{t.theme.title}</InputLabel>
              <Select
                labelId="theme-select-label"
                id="theme-select"
                value={currentTheme}
                label={t.theme.title}
                onChange={(e) => setCurrentTheme(e.target.value)}
              >
                <MenuItem value="light">{t.theme.light}</MenuItem>
                <MenuItem value="dark">{t.theme.dark}</MenuItem>
                <MenuItem value="green">{t.theme.green}</MenuItem>
                <MenuItem value="blue">{t.theme.blue}</MenuItem>
                <MenuItem value="darkBlue">{t.theme.darkBlue}</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            <FormControl fullWidth>
              <InputLabel id="language-select-label">{t.language.title}</InputLabel>
              <Select
                labelId="language-select-label"
                id="language-select"
                value={currentLanguage}
                label={t.language.title}
                onChange={(e) => setCurrentLanguage(e.target.value)}
              >
                <MenuItem value="en">{t.language.english}</MenuItem>
                <MenuItem value="ro">{t.language.romanian}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SettingsPage; 