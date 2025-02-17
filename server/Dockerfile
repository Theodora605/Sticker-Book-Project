# Latest permissable version is 3.12 due to CORS package
FROM python:3.12-alpine

EXPOSE 5000

WORKDIR /app

RUN apk add build-base linux-headers

COPY requirements.txt .

RUN pip install uwsgi
RUN pip install -r requirements.txt

COPY app.py .
COPY temp .
COPY application_default_credentials.json .
COPY wsgi.ini .
COPY wsgi.py .
COPY db_utils.py .
COPY db_init.py .

RUN python db_init.py

CMD ["uwsgi", "--ini", "/app/wsgi.ini"]
