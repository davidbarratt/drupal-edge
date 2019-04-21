FROM davidbarratt/drupal:8

ENV COMPOSER_ALLOW_SUPERUSER 1

# Dependencies
RUN apt-get update && apt-get install -y \
		  unzip \
			git \
    --no-install-recommends && rm -r /var/lib/apt/lists/*

COPY --from=composer:1.7 /usr/bin/composer /usr/bin/composer

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
