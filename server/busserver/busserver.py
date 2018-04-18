from flask import Flask, send_from_directory

app = Flask(__name__)
app.config.from_object(__name__)


@app.route('/')
def root():
    return app.send_static_file('index.html')


@app.route('/data/<path:path>')
def send_js(path):
    return send_from_directory('../../data/', path)
