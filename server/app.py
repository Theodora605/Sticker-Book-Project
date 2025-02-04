from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api, Resource
from flask_cors import CORS
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from google.cloud import storage
from typing import List
import uuid
import os

from sqlalchemy.engine import Engine
from sqlalchemy import event


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

GCS_STICKERS_BUCKET = "theo-stickers"
AUTH_PATH = "C:/Users/theo_/OneDrive/Documents/Sticker Book Project/server/application_default_credentials.json"
PROJECT_ID = "striking-effort-449723-j6"

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///stickers.db"
db = SQLAlchemy(app)
CORS(app)
api = Api(app)

class StickersTable(db.Model):
    __tablename__ = "stickers_table"

    # Schema
    id: Mapped[int] = mapped_column(primary_key=True)
    img_url: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str]

    # Relationships
    positions: Mapped[List["PositionsTable"]] = relationship(
        back_populates = "sticker", 
        cascade = "all, delete",
        passive_deletes = True
        )

class PositionsTable(db.Model):
    __tablename__ = "positions_table"

    # Schema
    id: Mapped[int] = mapped_column(primary_key=True)
    sticker_id: Mapped[int] = mapped_column(ForeignKey("stickers_table.id", ondelete="CASCADE"))
    matrix: Mapped[str]
    
    # Relationships
    sticker: Mapped["StickersTable"] = relationship(back_populates="positions")


class Stickers(Resource):
    def get(self):
        stickers = StickersTable.query.all()
        output = []
        for sticker in stickers:
            positions = []
            for position in sticker.positions:
                positions.append({
                    'id': position.id,
                    'matrix':position.matrix
                    })

            output.append({

                'id': sticker.id,
                'img': sticker.img_url,
                'name': sticker.name,
                'positions': positions

                })
        
        return jsonify(output)
    
    def post(self):
        file = request.files['img']
        
        if not file:
            return jsonify({'error': 'Image is required'})
        
        file_uuid = uuid.uuid4()
        filename_partition = file.filename.split(".")
        extension = filename_partition[-1]
        new_file_name = "".join(filename_partition[0:-1] + ['-',str(file_uuid), '.', extension])

        temp_file = f'./temp/{new_file_name}'
        file.save(temp_file)
        url = gcs_upload_image(temp_file)
        os.remove(temp_file)
        sticker = StickersTable(img_url=url, name=new_file_name)
        db.session.add(sticker)
        db.session.commit()
        return jsonify({'id': sticker.id, 'name': sticker.name, 'url':sticker.img_url})
    
class Sticker(Resource):

    def delete(self, id):
        sticker = StickersTable.query.get_or_404(id)

        if sticker is None:
            return jsonify({'error': 'Sticker not found.'})
        
        gcs_delete_image(sticker.name)

        db.session.delete(sticker)
        db.session.commit()

        return jsonify({'message': f'Sticker {id} was deleted.'})
    
class Positions(Resource):
    
    def post(self):
        data = request.get_json()

        position = PositionsTable(matrix=data['matrix'], sticker_id=data['sticker_id'])
        db.session.add(position)
        db.session.commit()

        return jsonify({'id': position.id, 'matrix': position.matrix, 'sticker_img': position.sticker.img_url})
    
class Position(Resource):

    def put(self, id):
        data = request.get_json()

        position = PositionsTable.query.get_or_404(id)
        position.matrix = data['matrix']
        db.session.commit()

        return jsonify({'message':f'Position {id} was updated.'})


    def delete(self, id):
        postion = PositionsTable.query.get_or_404(id)

        if postion is None:
            return jsonify({'error': f'Position with id {id} was not found.'})
        
        db.session.delete(postion)
        db.session.commit()

        return jsonify({'message': f'Position {id} was deleted.'})


def gcs_upload_image(filename: str):
    storage_client: storage.Client = storage.Client()
    bucket: storage.Bucket = storage_client.bucket(GCS_STICKERS_BUCKET)
    blob: storage.Blob = bucket.blob(filename.split("/")[-1])
    blob.upload_from_filename(filename)
    blob.make_public()
    public_url: str = blob.public_url
    print(f'Image uploaded to {public_url}')
    return public_url

def gcs_delete_image(blob_name: str):
    storage_client: storage.Client = storage.Client()
    bucket: storage.Bucket = storage_client.bucket(GCS_STICKERS_BUCKET)
    blob: storage.Blob = bucket.blob(blob_name)
    blob.delete()
    print(f'Blob {blob_name} was deleted.')




api.add_resource(Stickers, "/stickers")
api.add_resource(Sticker, "/stickers/<id>")
api.add_resource(Positions, "/positions")
api.add_resource(Position, "/positions/<id>")

if __name__ == "__main__":
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = AUTH_PATH
    os.environ["GCLOUD_PROJECT"] = PROJECT_ID
    app.run(debug=True)
