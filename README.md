# Sticker Book API

This Python application is a REST service for managing images (stickers) and their positions on a webpage (ie: CSS matrix transform)

## Build Instructions

To run this server, a Google Cloud account is required. You will need a Google Cloud project id, a Google Cloud bucket set up, as well as your application default credentials JSON file.

Check https://cloud.google.com/docs/authentication/application-default-credentials for information on how to generate the credentials file

In app.py, ensure that the `GCS_STICKERS_BUCKET` variable is set to the name of the bucket you wish to use, then build the docker image:

```
docker build -t sticker-api .
```

## Running the Server

Save the default credentials file to the folder you will like to use as a volume for temporary storage and run the following command from that directory:

```
docker run \
-p 5000:5000 \
-v .:/app/temp \
-e GOOGLE_APPLICATION_CREDENTIALS=/app/temp/[DEFAULT CREDENTIALS].json \
-e GCLOUD_PROJECT=[PROJECT ID] \
sticker-api
```

## API

A sample collection of requests can be forked from https://www.postman.com/gold-shadow-757137/stickers-api/overview

### 1. Get Stickers

Request:
`GET /stickers`

Sample Response:

```json
[
  {
    "id": 1,
    "img": "https://storage.googleapis.com/theo-stickers/black-bishop-d63b5b60-6701-4985-81cc-2bc704b45b73.png",
    "name": "black-bishop-d63b5b60-6701-4985-81cc-2bc704b45b73.png",
    "positions": [
      {
        "id": 2,
        "matrix": "0.99452,-0.10453,0.10453,0.99452,684,181"
      }
    ]
  }
]
```

This request returns a list of all of the stickers that are currently stored on the server. Each sticker has an id, the generated name of the sticker, the URI to where it is stored on Google Cloud, and a list of the positions where this sticker is placed.

### 2. Upload Sticker

Request:
`POST /stickers`

Body (form-data):

```
key: img
value: image file
```

This request submits the attached file to the Google Cloud bucket and saves a reference to it in the server.

### 3. Delete Sticker

Request:
`DELETE /stickers/<id>`

This request deletes the sticker and its associated positions with id equal to the passed path variable <id>.

### 4. Add Position

Request:
`POST /positions`

Sample Body (JSON):

```json
{
  "matrix": "1,0,0,1,100,100",
  "sticker_id": 1
}
```

This request links new position data as a CSS matrix transform to a specified sticker.

### 5. Delete Position

Request:
`DELETE /positions/<id>`

This request deletes the position with id equal to the passed path variable <id>.

### 6. Update Position

Request:
`PUT /positions/<id>`

Sample Body (JSON):

```json
{
  "matrix": "1,0,0,1,300,400"
}
```

This request updates the position with id equal to the passed path variable <id>.
