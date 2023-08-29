// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie("authToken"); // Clear the authorization cookie
  res.json({ message: "Logged out" });
});