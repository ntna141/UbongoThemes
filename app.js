const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config();

const app = express();

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

const themes = ['Our school',
'People in our home (nuclear family)',
'Our community',
'The human body and health',
'Weather',
'Accidents and safety',
'Living together',
'Food and nutrition',
'Our transport',
'Things we make',
'Our environment',
'Peace and security',
'Our school and neighbourhood',
'Our home and community',
'Transport in our community',
'Child protection',
'Measures',
'Recreation, festivals and holidays',
'Our sub-county/division',
'Our environment in our sub-county division',
'Environment and weather in our sub-county/division',
'Living things: plants in our sub-county/division',
'Managing resources in our sub-county/division',
'Keeping peace in our sub-county/division',
'Health in our sub-county/division',
'Basic technology in our sub-county/division',
'Energy in our sub-county/division',
'Sets',
'Numeracy',
'Geometry',
'Interpretation of graphs and data',
'Measurements',
'Algebra',
'Livelihood in our sub-county/division',
'Living things: animals in our sub-county/division',
'Culture and gender in our sub-county/division',
'Animals in our sub-county/division',
'Vehicle repair and maintenance',
'Print media',
'Travelling',
'Letter writing',
'Communication - the post office, internet and telephone',
'Culture',
'Services (banking)',
'Safety on the road',
'Debating',
'Family relationships',
'Occupations - carpentry, baking, tailoring, keeping animals',
'Hotels',
'Using dictionary',
'School holidays',
'Examinations',
'Electronic media',
'Rights, responsibilities and freedom',
'Environmental protection',
'Ceremonies',
'The environment',
'Human health',
'The human body',
'Matter and energy',
'Managing changes in the environment',
'Science in human activities and occupation',
'Community population and family life',
'The world of living things',
'Human body',
'The community, population and family life',
'Living together in uganda',
'The east african community',
'Major resources of east africa',
'Transport and communication in east africa',
'The road to independence in east africa',
'Responsible living in the east african environment',
'Location of africa on the map of the world',
'Physical features',
'Climate of africa',
'Vegetation of africa',
'The people of africa, ethnic groups and settlement patterns',
'Foreign influence in africa',
'Nationalism and the road to independent africa',
'Post-independence africa',
'Economic developments in africa',
'Major world organisations',
];

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

app.post('/transcribe_images', async (req, res) => {
  if (!req.body.images || req.body.images.length === 0) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    console.log('Sending transcription request to OpenAI API...');
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });

    console.log('Received transcription response from OpenAI API');
    const transcript = response.choices[0].message.content;

    res.json({ transcript: transcript });
  } catch (error) {
    console.error('Error transcribing images:', error.response?.data || error.message);
    res.status(500).json({ error: error.message || 'An error occurred while transcribing the images.' });
  }
});

// Route for theme analysis
app.post('/analyze_theme', async (req, res) => {
  if (!req.body.transcript) {
    return res.status(400).json({ error: 'No transcript provided' });
  }

  try {
    console.log('Sending theme analysis request to OpenAI API...');
    const messages = [
      {
        role: "system",
        content: `You will decide if the transcript I sent you aligns with one of these themes: ${themes.join(", ")}. Pick the one most appropriate, and send back the name of the matching theme and the learning goal of the text, and NOTHING ELSE. It should look like "theme and objective"`
      },
      {
        role: "user",
        content: req.body.transcript
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });

    console.log('Received theme analysis response from OpenAI API');
    const analyzedTheme = response.choices[0].message.content;

    res.json({ analyzedTheme: analyzedTheme });
  } catch (error) {
    console.error('Error analyzing theme:', error.response?.data || error.message);
    res.status(500).json({ error: error.message || 'An error occurred while analyzing the theme.' });
  }
});

// Catch-all handler for any request that doesn't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

module.exports = app;