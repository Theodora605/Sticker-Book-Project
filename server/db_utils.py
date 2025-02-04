from app import *

def drop_all():
    with app.app_context():
        StickersTable.__table__.drop(db.engine)
        PositionsTable.__table__.drop(db.engine)

def init():
    with app.app_context():
        db.create_all()