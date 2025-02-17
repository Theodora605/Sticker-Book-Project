from app import app
import os

AUTH_PATH = "/app/application_default_credentials.json"
PROJECT_ID = "striking-effort-449723-j6"

if __name__ == "__main__":
    #os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = AUTH_PATH
    #os.environ["GCLOUD_PROJECT"] = PROJECT_ID
    app.run()