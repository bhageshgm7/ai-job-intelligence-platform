#!/bin/sh
set -e

echo "==> Running Django database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files for WhiteNoise..."
python manage.py collectstatic --noinput

PORT="${PORT:-8000}"
echo "==> Starting Gunicorn production WSGI server on 0.0.0.0:$PORT..."
exec gunicorn config.wsgi:application --bind "0.0.0.0:$PORT" --workers 2 --threads 4 --timeout 120
