import React from "react";
import PropTypes from "prop-types";
React;
function FormSection({ config }) {
  if (!config) return null;

  return (
    <form method="post" action="/input" className="w-full">
      <input type="hidden" name="formType" value={config.hidden.formType} />

      {/* Desktop */}
      <div className="hidden md:flex flex-wrap gap-4 items-end justify-center mb-4">
        {config.fields.map((field) => (
          <div key={field.name} className="flex flex-col">
            {field.label && (
              <label className="text-black text-[13px] underline">{field.label}</label>
            )}
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              className="p-2 border rounded min-w-[150px] max-w-xs"
            />
          </div>
        ))}
        <button type="submit" className="p-2 text-white bg-[#01502E] rounded min-w-[120px]">
          Search
        </button>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-2 p-2">
        {config.fields.map((field) => (
          <div key={field.name} className="flex flex-col">
            {field.label && (
              <label className="text-[10px] text-black">{field.label}</label>
            )}
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              className="w-full p-2 border rounded"
            />
          </div>
        ))}
        <button type="submit" className="w-full p-2 text-white bg-[#01502E] rounded">
          Search
        </button>
      </div>
    </form>
  );
}


FormSection.propTypes = {
  tab: PropTypes.any,
  config: PropTypes.shape({
    hidden: PropTypes.shape({
      formType: PropTypes.any,
    }),
    fields: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        label: PropTypes.string,
        type: PropTypes.string,
        placeholder: PropTypes.string,
      })
    ),
  }),
};

export default FormSection;
