FROM davidbarratt/drupal:8

COPY ./ /var/www

RUN composer --no-dev install -d /var/www

ENV PATH="/var/www/vendor/bin:${PATH}"

RUN mkdir -p /var/www/tmp \
  && mkdir -p /var/www/config \
  && mkdir -p /var/www/html/sites/default/files

# Set the permissions.
RUN chown -R www-data:www-data /var/www/html/sites/default/files \
  && chown -R www-data:www-data /var/www/config \
  && chown -R www-data:www-data /var/www/tmp
