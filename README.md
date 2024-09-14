Here's an updated `README.md` file based on the information you provided:

```markdown
# UbongoThemes Setup on Amazon EC2

This guide explains how to pull the UbongoThemes repository onto an Amazon EC2 instance, set up the environment, install dependencies, and start the application using `pm2`.

## Prerequisites

- An Amazon EC2 instance running a Linux distribution (e.g., Ubuntu)
- SSH access to the EC2 instance
- Node.js and npm installed on the EC2 instance
- `git` installed on the EC2 instance
- `pm2` installed globally on the EC2 instance

## 1. Connect to the EC2 Instance

First, connect to your EC2 instance via SSH:

```bash
ssh -i path/to/your-key.pem ubuntu@your-ec2-public-dns
```

Replace `path/to/your-key.pem` with the path to your SSH key and `your-ec2-public-dns` with the public DNS of your EC2 instance.

## 2. Pull the Repository

Once connected to the EC2 instance, navigate to the directory where you want to clone the repository and run:

```bash
git clone https://github.com/ntna141/UbongoThemes.git
```

After cloning, navigate into the project directory:

```bash
cd UbongoThemes
```

## 3. Create an `.env` File

Create a new `.env` file in the project root directory:

```bash
nano .env
```

Add the required environment variables to this file:

```env
OPENAI_API_KEY=your-openai-api-key
PORT=3000
```

Replace `your-openai-api-key` with your actual OpenAI API key. Save and exit the editor (for nano, press `CTRL + X`, then `Y`, and `Enter`).

## 4. Install Dependencies

Make sure you're in the project directory, then run the following command to install the project's dependencies:

```bash
npm install
```

## 5. Build the Static Files (if applicable)

If the project requires building static files, run the build command:

```bash
npm run build
```

This will generate a `build` directory (or similar) containing the static files.

## 6. Install `pm2` (if not already installed)

`pm2` is a process manager for Node.js applications. If you haven't installed `pm2` yet, you can do so with the following command:

```bash
sudo npm install -g pm2
```

## 7. Start the Application with `pm2`

To start the application using `pm2`, use the following command:

```bash
pm2 start npm --name "UbongoThemes" -- start
```

Ensure that your `package.json` has a `start` script that serves the static files, for example:

```json
"scripts": {
  "start": "serve -s build -l 3000"
}
```

## 8. Save the `pm2` Process List and Set Up Startup Script

To save the current process list for automatic startup on server reboots, run:

```bash
pm2 save
```

Then, set up `pm2` to start on boot:

```bash
pm2 startup
```

Follow the instructions provided by `pm2 startup` to enable the startup script.

## 9. Check Application Status

To check if your application is running, use:

```bash
pm2 list
```

This command shows a list of all processes managed by `pm2`.

## 10. Viewing Logs

To view the logs for your application, use:

```bash
pm2 logs UbongoThemes
```

## 11. Updating the Application

To pull the latest changes from the repository, navigate to the project directory and run:

```bash
git pull
npm install
npm run build
pm2 restart UbongoThemes
```

## 12. Additional Resources

- [Node.js Installation Guide](https://nodejs.org/en/download/package-manager/)
- [pm2 Documentation](https://pm2.keymetrics.io/)

## Conclusion

Your application should now be running on your Amazon EC2 instance, served by `pm2`. You can access it via the public IP address or domain of your EC2 instance at the port specified in your `.env` file.
```
