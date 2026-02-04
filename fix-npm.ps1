# Fix for npm PowerShell Error
# Run PowerShell as Administrator and execute this command:

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then verify it worked:
Get-ExecutionPolicy

# Now try npm again:
npm --version
