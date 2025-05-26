// Custom widgets for Decap CMS
const { h } = window.CMS;

// Image with Alt Text Widget
const ImageWithAltControl = {
  handleChange: function(e) {
    const { name, value } = e.target;
    this.props.onChange({
      ...this.props.value,
      [name]: value
    });
  },

  render: function() {
    const { value, forID, classNameWrapper } = this.props;
    return h('div', { className: classNameWrapper },
      h('div', { className: 'image-with-alt' },
        h('label', { htmlFor: `${forID}-url` }, 'Image'),
        h('input', {
          id: `${forID}-url`,
          name: 'url',
          type: 'file',
          accept: 'image/*',
          onChange: this.handleChange.bind(this),
          value: value?.url || ''
        }),
        h('label', { htmlFor: `${forID}-alt` }, 'Alt Text'),
        h('input', {
          id: `${forID}-alt`,
          name: 'alt',
          type: 'text',
          onChange: this.handleChange.bind(this),
          value: value?.alt || ''
        })
      )
    );
  }
};

const ImageWithAltPreview = {
  render: function() {
    const { value } = this.props;
    return h('div', { className: 'image-preview' },
      value?.url && h('img', { src: value.url, alt: value.alt || '' }),
      value?.alt && h('p', {}, value.alt)
    );
  }
};

// Section Widget
const SectionControl = {
  handleChange: function(e) {
    const { name, value } = e.target;
    this.props.onChange({
      ...this.props.value,
      [name]: value
    });
  },

  render: function() {
    const { value, forID, classNameWrapper } = this.props;
    return h('div', { className: classNameWrapper },
      h('div', { className: 'section-control' },
        h('label', { htmlFor: `${forID}-label` }, 'Section Label'),
        h('input', {
          id: `${forID}-label`,
          name: 'label',
          type: 'text',
          onChange: this.handleChange.bind(this),
          value: value?.label || ''
        }),
        h('label', { htmlFor: `${forID}-text` }, 'Content'),
        h('textarea', {
          id: `${forID}-text`,
          name: 'text',
          onChange: this.handleChange.bind(this),
          value: value?.text || ''
        })
      )
    );
  }
};

const SectionPreview = {
  render: function() {
    const { value } = this.props;
    return h('div', { className: 'section-preview' },
      value?.label && h('h3', {}, value.label),
      value?.text && h('div', { className: 'content' }, value.text)
    );
  }
};

// Define schemas for the widgets
const imageWithAltSchema = {
  properties: {
    url: { type: 'string' },
    alt: { type: 'string' }
  }
};

const sectionSchema = {
  properties: {
    label: { type: 'string' },
    text: { type: 'string' }
  }
};

// Create React components from our widget definitions
const createReactComponent = (widget) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.handleChange = widget.handleChange?.bind(this) || (() => {});
    }

    render() {
      return widget.render.call(this);
    }
  };
};

// Wait for CMS to be ready before registering widgets
if (window.CMS) {
  // Register the widgets with their schemas
  CMS.registerWidget('image-with-alt', 
    createReactComponent(ImageWithAltControl), 
    createReactComponent(ImageWithAltPreview), 
    imageWithAltSchema
  );
  CMS.registerWidget('section', 
    createReactComponent(SectionControl), 
    createReactComponent(SectionPreview), 
    sectionSchema
  );
} else {
  window.addEventListener('load', function() {
    if (window.CMS) {
      CMS.registerWidget('image-with-alt', 
        createReactComponent(ImageWithAltControl), 
        createReactComponent(ImageWithAltPreview), 
        imageWithAltSchema
      );
      CMS.registerWidget('section', 
        createReactComponent(SectionControl), 
        createReactComponent(SectionPreview), 
        sectionSchema
      );
    }
  });
} 