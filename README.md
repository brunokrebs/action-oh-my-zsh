# GitHub Actions - Debugging with Oh My Zsh

This GitHub Actions workflow allows you to debug your GitHub Actions workflow using Oh My Zsh.

## Usage

To be able to use the debugging action, you will need an Ngrok account and will need to provide the `NGROK_AUTH_TOKEN` as a secret in your repository. You can create a new Ngrok account [here](https://dashboard.ngrok.com/signup).

Instructions about how to create a secret in your repository can be found [here](https://docs.github.com/en/actions/reference/encrypted-secrets).

```yaml
name: My Workflow Using Debugging Action

on: [push, pull_request]

jobs:
  debug-environment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Dependencies
        run: npm install

      - name: Run Tests
        run: npm test
      
      # Use your custom debugging action
      - name: Debug with SSH and Oh My Zsh
        uses: your-username/debugging-with-oh-my-zsh-action@main
        if: failure()
        env:
          NGROK_AUTH_TOKEN: ${{ secrets.NGROK_AUTH_TOKEN }}
```

Notice the `if: failure()` condition. This will only run the debugging action if the previous step fails.
