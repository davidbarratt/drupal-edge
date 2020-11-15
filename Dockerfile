FROM davidbarratt/drupal:8

# @TODO Move this into the drupal container?

# Add a non-root user for development.
ARG USERNAME=dev
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create the user
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME

# Add ssh & gpg for pushing & signing commits.
RUN apt-get update && apt-get install -y \
  openssh-client \
  gnupg2 \
  && rm -rf /var/lib/apt/lists/*

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
