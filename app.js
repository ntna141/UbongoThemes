const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the 'build' directory
app.use(express.static(path.join(__dirname, 'build')));

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Check if required environment variables are set
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

// Shared state
let sharedState = {
  gptResponse: '',
  isLoading: false,
  autoAnalyze: false
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('getState', () => {
    socket.emit('stateUpdate', sharedState);
  });

  socket.on('updateState', (newState) => {
    sharedState = { ...sharedState, ...newState };
    io.emit('stateUpdate', sharedState);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.post('/process_images', async (req, res) => {
  if (!req.body.images || req.body.images.length === 0) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    // Update shared state to indicate processing has started
    sharedState.isLoading = true;
    io.emit('stateUpdate', sharedState);

    console.log('Sending request to OpenAI API...');
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant who will transcribe the texts in the images I send you and return a coherent transcript."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Transcribe the texts in the images I send you and return a coherent transcript"
          },
          ...req.body.images.map(base64Image => ({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high"
            }
          }))
        ]
      }
    ];

    const initialResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });

    console.log('Received initial response from OpenAI API');
    const initialTranscript = initialResponse.choices[0].message.content;

    // Send a follow-up request with the new prompt
    console.log('Sending follow-up request to OpenAI API...');
    const followUpMessages = [
      ...messages,
      {
        role: "system",
        content: "You are a helpful teacher who will provide the optimal solution to the code and an explanation for that code for this challenge with NO usage example. Your answer should start with the data structure or technique used to solve this problem"
      },
      {
        role: "user",
        content: initialTranscript
      }
    ];

    const followUpResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: followUpMessages,
    });

    console.log('Received follow-up response from OpenAI API');
    const finalResponse = followUpResponse.choices[0].message.content;

    // Update shared state with the final response
    sharedState.gptResponse = finalResponse;
    sharedState.isLoading = false;
    io.emit('stateUpdate', sharedState);

    res.json({
      initialTranscript: initialTranscript,
      finalResponse: finalResponse
    });
  } catch (error) {
    console.error('Error processing images:', error.response?.data || error.message);

    // Update shared state to indicate an error
    sharedState.gptResponse = 'An error occurred while processing the images.';
    sharedState.isLoading = false;
    io.emit('stateUpdate', sharedState);

    res.status(500).json({ error: error.message || 'An error occurred while processing the images.' });
  }
});

// Catch-all handler for any request that doesn't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

module.exports = { app, server };