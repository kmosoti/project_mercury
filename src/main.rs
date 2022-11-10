use serenity::async_trait;
use serenity::model::channel::Message;
use serenity::model::gateway::Ready;
use serenity::prelude::*;

//import gptconnection
mod gptconnection;

//import discord bot token from .env file
//use dotenv;
//use std::env;

struct Handler;

#[async_trait]
impl EventHandler for Handler {



    // Set a handler for the `message` event - so that whenever a new message
    // is received - the closure (or function) passed will be called.
    //
    // Event handlers are dispatched through a threadpool, and so multiple
    // events can be dispatched simultaneously.
    async fn message(&self, ctx: Context, msg: Message) {
        // if msg.content == "!ping" {
        //     // Sending a message can fail, due to a network error, an
        //     // authentication error, or lack of permissions to post in the
        //     // channel, so log to stdout when some error happens, with a
        //     // description of it.
        //     if let Err(why) = msg.channel_id.say(&ctx.http, "Pong!").await {
        //         println!("Error sending message: {:?}", why);
        //     }
        // }
        // //Handler for !hello command
        // else if msg.content == "!hello" {
        //     if let Err(why) = msg.channel_id.say(&ctx.http, "Hello!").await {
        //         println!("Error sending message: {:?}", why);
        //     }

        // }
        // //Handler for !help command
        // else if msg.content == "!help" {
        //     if let Err(why) = msg.channel_id.say(&ctx.http, "Commands: !ping, !hello, !help").await {
        //         println!("Error sending message: {:?}", why);
        //     }
        // }
        //Prevent bot from responding to itself or non-commands
        if msg.author.bot || !msg.content.starts_with("!") {
            return;
        }
        //handler for !gpt command
        else if msg.content.starts_with("!gpt") {
            //Get the prompt from the message
            let prompt = msg.content[4..].to_string();
            //Build the request
            // let request = gptconnection::build_request(prompt);
            // print!("\nRequest Result:\n\n {:#?}\n", request);
            // //Send the request
            // let response = gptconnection::send_request(request).await;
            // print!("{:#?}", response);
            // //Get OAI response and turn it into a string
            // let response = gptconnection::get_response(response);

            //Send the response
            let gpt_response = gptconnection::get_response(prompt).await;
            if let Err(why) = msg.channel_id.say(&ctx.http, gpt_response).await {
                println!("Error sending message: {:#?}", why);
            }
        }
        
        //handle all other messages
    }

    // Set a handler to be called on the `ready` event. This is called when a
    // shard is booted, and a READY payload is sent by Discord. This payload
    // contains data like the current user's guild Ids, current user data,
    // private channels, and more.
    //
    // In this case, just print what the current user's username is.
    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} is connected!", ready.user.name);
    }
}

#[tokio::main]
async fn main() {
    // Configure the client with your DISCORD_BOT_TOKEN in the environment.
    dotenv::dotenv().ok();
    let token = dotenv::var("DISCORD_BOT_TOKEN")
        .expect("Expected a token in the environment");
    
    //println!("Token: {}", token);
    //check if discord bot token is available
    // Configure the client with your Discord bot token in the environment.
    // Set gateway intents, which decides what events the bot will be notified about
    let intents = GatewayIntents::GUILD_MESSAGES
        | GatewayIntents::DIRECT_MESSAGES
        | GatewayIntents::MESSAGE_CONTENT;

    // Create a new instance of the Client, logging in as a bot. This will
    // automatically prepend your bot token with "Bot ", which is a requirement
    // by Discord for bot users.
    let mut client =
        Client::builder(&token, intents).event_handler(Handler).await.expect("Err creating client");

    // Finally, start a single shard, and start listening to events.
    //
    // Shards will automatically attempt to reconnect, and will perform
    // exponential backoff until it reconnects.
    if let Err(why) = client.start().await {
        println!("Client error: {:?}", why);
    }
}