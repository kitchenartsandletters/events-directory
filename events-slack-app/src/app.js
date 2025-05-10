require('dotenv').config();

const { App: BoltApp, ExpressReceiver } = require('@slack/bolt');
const express = require('express');
const { listEvents, createEvent, handleCreateEventSubmission, editEvent, handleEditEventSubmission } = require('./commands');

// Set up an ExpressReceiver to use the same Express app
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: '/slack/events'
});

// Initialize the Bolt App with your bot token and custom receiver
const bolt = new BoltApp({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// Register the /list-events slash command handler
bolt.command('/list-events', listEvents);
bolt.command('/create-event', createEvent);
bolt.command('/edit-event', editEvent);

// Register the view submission handler for the create-event modal
bolt.view('create-event-view', handleCreateEventSubmission);
bolt.view('edit-event-view', handleEditEventSubmission);

// Add an optional health-check endpoint to the underlying Express app
receiver.app.get('/health', (req, res) => {
  res.send('OK');
});

// Start the Bolt app (and underlying Express server)
(async () => {
  await bolt.start(process.env.PORT || 3000);
  console.log('⚡ Bolt app is running');
})();