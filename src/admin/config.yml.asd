local_backend: true

backend:
  name: :git-gateway
  branch: main

site_url: https://www.matthewfreedpottery.ca

publish_mode: simple

public_folder: src/images
media_folder: dist/images

collections:
  - name: Events
    label: Events
    widget: list
    identifier_field: events
    files:
      - label: events
        name: Events
        file: src/views/_data/events.json
        fields:
          - label: Date
            name: date
            widget: date
            format: "MM-DD-YYYY"
          - label: "Is it a multi day event?"
            name: multi_day_event
            widget: boolean
            default: false
          - name: end_date
            widget: date
          - name: time
            widget: string
          - name: name
            widget: string
          - name: location
            widget: string
          - name: content
            widget: object
            fields:
              - {name: title, widget: string}
              - {name: body, widget: string}
          - name: image
            widget: object
            fields:
              - {name: url, widget: image}
              - {name: alt, widget: string}
          - name: gmaps
            widget: string
          - name: featured
            widget: boolean
            default: true

    

