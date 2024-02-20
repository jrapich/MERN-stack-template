import { AppBar, Toolbar, Typography, Container } from "@mui/material";

export default function Header() {
  return (
    <>
      <AppBar position="relative">
        <Toolbar>
          <Container>
            <Typography variant="h5" color="inherit" align="center" noWrap>
              Header
            </Typography>
          </Container>
        </Toolbar>
      </AppBar>
    </>
  );
}
