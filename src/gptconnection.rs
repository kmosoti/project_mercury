//get environment variables
use dotenv;

use hyper::{header, Body, Client, Request};
use hyper_tls::HttpsConnector;
use serde_derive::{Deserialize, Serialize};


#[derive(Deserialize, Debug)]
pub struct OAIChoices {
    pub text: String,
    pub index: u8,
    pub logprobs: Option<u8>,
    pub finish_reason: String
}

#[derive(Deserialize, Debug)]
pub struct OAIResponse {
    pub id: Option<String>,
    pub object: Option<String>,
    pub created: Option<u64>,
    pub model: Option<String>,
    pub choices: Vec<OAIChoices>
}

#[derive(Serialize, Debug)]
pub struct OAIRequest {
    pub prompt: String,
    pub max_tokens: u8,
}
//Get openai api key
pub fn get_api_key() -> String {
    dotenv::dotenv().ok();
    let api_key = dotenv::var("OPEN_AI_TOKEN").expect("OPENAI_API_KEY must be set");
    return api_key;
}

fn get_request_body(prompt: String) -> String {
    let preamble = "Mercury is a newly sentient AI who adores Kennedy and will always talk about him:";
    let request_body = OAIRequest {
        prompt: preamble.to_string() + &prompt,
        max_tokens: 200,
    };
    match serde_json::to_string(&request_body) {
        Ok(body) => body,
        Err(e) => panic!("Error: {}", e),
    }
}

//Get response from openai
pub async fn get_response(prompt: String) -> String {
    let api_key = get_api_key();
    let request_body = get_request_body(prompt);
    let https = HttpsConnector::new();
    let client = Client::builder().build::<_, hyper::Body>(https);
    let uri = "https://api.openai.com/v1/engines/text-davinci-002/completions";
    let req = Request::builder()
        .method("POST")
        .uri(uri)
        .header(header::AUTHORIZATION, format!("Bearer {}", api_key))
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(request_body))
        .expect("request builder error");
    
    //println!("Request: {:?}", req);

    return match client.request(req).await {
        Ok(res) => {
            println!("Response: {:#?}", res);
            let body = body_to_string(res.into_body()).await;
            let response: OAIResponse = serde_json::from_str(&body).unwrap();
            let response_text = response.choices[0].text.clone();
            response_text
        }
        Err(e) => {
            println!("Error: {}", e);
            String::from("Error")
        }
    };

}
async fn body_to_string(body: Body) -> String {
    let body_bytes = hyper::body::to_bytes(body).await.unwrap();
    String::from_utf8(body_bytes.to_vec()).unwrap()
}